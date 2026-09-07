// Orchestrates "order placed → PayPhone link emailed" and
// "PayPhone approved → Shopify order marked paid". Server-only.
//
// Trust model: nothing that arrives from the outside is believed on its own.
// A Shopify webhook is HMAC-verified in the route, and we still re-read the
// order from the Admin API before acting. A PayPhone notification (or the
// reconcile job) only names a transaction; we look it up on PayPhone with our
// token, check the amount against the order's outstanding balance, and only
// then mark the order paid. Every step is idempotent so retries are safe.

import {
  addOrderTags,
  findPendingPayphoneOrders,
  getOrder,
  hasAdminCredentials,
  markOrderPaid,
  orderGid,
  savePaymentLink,
  sendPaymentLinkEmail,
  TAG_PAID,
  type AdminEnv,
  type PaymentOrder,
} from '~/lib/shopify-admin';
import {
  buildClientTransactionId,
  createPaymentLink,
  getSaleByClientTransactionId,
  getSaleByTransactionId,
  isApproved,
  linkExpireHours,
  orderIdFromClientTransactionId,
  splitAmounts,
  toCents,
  type PayphoneEnv,
  type PayphoneSale,
} from '~/lib/payphone';

export type FlowEnv = AdminEnv & PayphoneEnv;

/** Null when any required secret is missing, so routes can answer 503. */
export function getFlowEnv(env: Partial<Record<keyof FlowEnv, string | undefined>>): FlowEnv | null {
  const {PUBLIC_STORE_DOMAIN, PAYPHONE_API_TOKEN} = env;
  if (!PUBLIC_STORE_DOMAIN || !PAYPHONE_API_TOKEN || !hasAdminCredentials(env)) {
    return null;
  }
  return {
    PUBLIC_STORE_DOMAIN,
    SHOPIFY_CLIENT_ID: env.SHOPIFY_CLIENT_ID,
    SHOPIFY_CLIENT_SECRET: env.SHOPIFY_CLIENT_SECRET,
    SHOPIFY_ADMIN_API_TOKEN: env.SHOPIFY_ADMIN_API_TOKEN,
    PAYPHONE_API_TOKEN,
    PAYPHONE_STORE_ID: env.PAYPHONE_STORE_ID,
    PAYPHONE_LINK_EXPIRE_HOURS: env.PAYPHONE_LINK_EXPIRE_HOURS,
  };
}

/**
 * Secret that signs incoming Shopify webhooks. App-owned subscriptions are
 * signed with the app's client secret; admin-created ones with the store's
 * webhook signing secret. SHOPIFY_WEBHOOK_SECRET wins when set.
 */
export function getWebhookSecret(
  env: Partial<Record<'SHOPIFY_WEBHOOK_SECRET' | 'SHOPIFY_CLIENT_SECRET', string | undefined>>,
): string | undefined {
  return env.SHOPIFY_WEBHOOK_SECRET || env.SHOPIFY_CLIENT_SECRET || undefined;
}

/** The two fields we read from Shopify's `orders/create` payload. */
export type OrderCreatedPayload = {
  admin_graphql_api_id?: string;
  id?: number | string;
  financial_status?: string;
};

export type LinkResult =
  | {status: 'linked'; order: string; link: string; emailed: boolean}
  | {status: 'skipped'; order: string | null; reason: 'not-pending' | 'already-linked' | 'order-not-found' | 'no-order-id'};

export type SettleResult =
  | {status: 'paid'; order: string; transactionId: number}
  | {
      status: 'skipped';
      order: string | null;
      reason:
        | 'sale-not-found'
        | 'not-approved'
        | 'unknown-client-tx'
        | 'order-not-found'
        | 'already-paid'
        | 'client-tx-mismatch'
        | 'amount-mismatch';
      detail?: string;
    };

function paymentEmail(order: PaymentOrder, link: string, hours: number) {
  return {
    to: order.email,
    subject: `Tu enlace de pago de Biothree · Pedido ${order.name}`,
    customMessage: [
      `Gracias por tu pedido ${order.name} en Biothree.`,
      '',
      'Para pagar con tarjeta, abre este enlace de PayPhone desde tu celular:',
      link,
      '',
      `El enlace vence en ${hours} horas. Si prefieres pagar con DeUna o transferencia, sigue las instrucciones de tu confirmación de pedido y envíanos el comprobante.`,
    ].join('\n'),
  };
}

/**
 * Creates and emails a PayPhone link for a freshly placed, unpaid order.
 * Safe to call more than once for the same order: the second call finds the
 * stored link and stops.
 */
export async function handleOrderCreated(
  payload: OrderCreatedPayload,
  env: FlowEnv,
): Promise<LinkResult> {
  const orderId =
    payload.admin_graphql_api_id ?? (payload.id != null ? orderGid(payload.id) : null);
  if (!orderId) return {status: 'skipped', order: null, reason: 'no-order-id'};

  // Only manual payment methods leave an order pending. Card orders (if a
  // gateway is ever added) arrive paid and must not get a link.
  if (payload.financial_status && payload.financial_status !== 'pending') {
    return {status: 'skipped', order: orderId, reason: 'not-pending'};
  }

  const order = await getOrder(env, orderId);
  if (!order) return {status: 'skipped', order: orderId, reason: 'order-not-found'};
  if (order.displayFinancialStatus && order.displayFinancialStatus !== 'PENDING') {
    return {status: 'skipped', order: order.name, reason: 'not-pending'};
  }
  if (order.payphoneLink) {
    return {status: 'skipped', order: order.name, reason: 'already-linked'};
  }

  const amounts = splitAmounts({
    totalCents: toCents(order.totalOutstanding.amount),
    taxCents: toCents(order.totalTax.amount),
    taxRate: order.taxRates[0] ?? null,
  });
  const clientTransactionId = buildClientTransactionId(order.legacyResourceId);
  const hours = linkExpireHours(env);

  const link = await createPaymentLink(env, {
    clientTransactionId,
    amounts,
    reference: `Biothree ${order.name}`,
    expireInHours: hours,
  });

  // Persist before emailing: if the email fails, a retry finds the link and
  // skips instead of minting a second one.
  await savePaymentLink(env, order.id, {link, clientTransactionId});

  let emailed = false;
  try {
    await sendPaymentLinkEmail(env, order.id, paymentEmail(order, link, hours));
    emailed = true;
  } catch (error) {
    // The link is on the order, so staff can still send it by hand.
    console.error(`PayPhone link email failed for ${order.name}:`, error);
  }

  return {status: 'linked', order: order.name, link, emailed};
}

/**
 * Marks the matching Shopify order paid if PayPhone confirms the transaction
 * is approved and the amount matches what the order still owes.
 */
export async function settleTransaction(
  ref: {transactionId?: number | string | null; clientTransactionId?: string | null},
  env: FlowEnv,
): Promise<SettleResult> {
  let sale: PayphoneSale | null = null;
  if (ref.transactionId != null && ref.transactionId !== '') {
    sale = await getSaleByTransactionId(env, ref.transactionId);
  } else if (ref.clientTransactionId) {
    sale = await getSaleByClientTransactionId(env, ref.clientTransactionId);
  }
  if (!sale) return {status: 'skipped', order: null, reason: 'sale-not-found'};
  if (!isApproved(sale)) {
    return {
      status: 'skipped',
      order: null,
      reason: 'not-approved',
      detail: `${sale.transactionStatus} (${sale.statusCode})`,
    };
  }

  const legacyId = orderIdFromClientTransactionId(sale.clientTransactionId);
  if (!legacyId) {
    return {status: 'skipped', order: null, reason: 'unknown-client-tx', detail: sale.clientTransactionId};
  }

  const order = await getOrder(env, orderGid(legacyId));
  if (!order) return {status: 'skipped', order: legacyId, reason: 'order-not-found'};
  if (order.displayFinancialStatus === 'PAID' || order.tags.includes(TAG_PAID)) {
    return {status: 'skipped', order: order.name, reason: 'already-paid'};
  }
  if (order.payphoneClientTx && order.payphoneClientTx !== sale.clientTransactionId) {
    return {
      status: 'skipped',
      order: order.name,
      reason: 'client-tx-mismatch',
      detail: `order has ${order.payphoneClientTx}, sale has ${sale.clientTransactionId}`,
    };
  }

  const owed = toCents(order.totalOutstanding.amount);
  if (sale.amount !== owed) {
    console.error(
      `PayPhone amount mismatch for ${order.name}: sale ${sale.amount}, outstanding ${owed}`,
    );
    return {
      status: 'skipped',
      order: order.name,
      reason: 'amount-mismatch',
      detail: `sale ${sale.amount} vs outstanding ${owed}`,
    };
  }

  await markOrderPaid(env, order.id);
  await addOrderTags(env, order.id, [TAG_PAID]);
  return {status: 'paid', order: order.name, transactionId: sale.transactionId};
}

export type ReconcileResult = {
  checked: number;
  paid: number;
  results: Array<{order: string; result: SettleResult['status']; reason?: string}>;
};

/**
 * Sweeps pending orders that have a link and settles any PayPhone reports as
 * approved. This is the safety net for when PayPhone's notification doesn't
 * arrive. Capped so a run stays under PayPhone's 30 requests/minute.
 */
export async function reconcilePendingOrders(
  env: FlowEnv,
  {max = 25}: {max?: number} = {},
): Promise<ReconcileResult> {
  const orders = await findPendingPayphoneOrders(env, max);
  const results: ReconcileResult['results'] = [];
  let paid = 0;

  for (const order of orders) {
    const clientTransactionId =
      order.payphoneClientTx ?? buildClientTransactionId(order.legacyResourceId);
    try {
      const result = await settleTransaction({clientTransactionId}, env);
      if (result.status === 'paid') paid++;
      results.push({
        order: order.name,
        result: result.status,
        ...(result.status === 'skipped' ? {reason: result.reason} : {}),
      });
    } catch (error) {
      console.error(`Reconcile failed for ${order.name}:`, error);
      results.push({order: order.name, result: 'skipped', reason: 'error'});
    }
  }

  return {checked: orders.length, paid, results};
}
