// Orchestrates the PayPhone payment flows against Shopify orders. Server-only.
//
// 1. Checkout (the main path): the storefront creates a pending order, then
//    `startPayphonePayment` registers a PayPhone button payment and hands back
//    the hosted URL the customer is redirected to. PayPhone sends them back to
//    /pago/payphone/respuesta, where `confirmPayphonePayment` confirms the
//    transaction with PayPhone and marks the order paid.
// 2. Legacy link (orders placed through Shopify's own checkout with the manual
//    payment method): `handleOrderCreated` mints a payment link and emails it.
// 3. Safety net: `reconcilePendingOrders` sweeps pending orders that have an
//    attempt on record and settles the ones PayPhone reports as approved.
//
// Trust model: nothing that arrives from the outside is believed on its own.
// A Shopify webhook is HMAC-verified in the route, and we still re-read the
// order from the Admin API before acting. A PayPhone redirect or notification
// only names a transaction; we ask PayPhone about it with our token, check
// the amount against the order's outstanding balance, and only then mark the
// order paid. Every step is idempotent so reloads and retries are safe.

import {
  addOrderTags,
  findPendingPayphoneOrders,
  getOrder,
  hasAdminCredentials,
  isOrderPaid,
  markOrderPaid,
  orderGid,
  savePaymentLink,
  sendPaymentLinkEmail,
  TAG_CHECKOUT,
  TAG_PAID,
  type AdminEnv,
  type PaymentOrder,
} from '~/lib/shopify-admin';
import {
  buildClientTransactionId,
  confirmButtonPayment,
  createPaymentLink,
  ERROR_CODE_DUPLICATE_CLIENT_TX,
  getSaleByClientTransactionId,
  getSaleByTransactionId,
  isApproved,
  linkExpireHours,
  nextClientTransactionId,
  orderIdFromClientTransactionId,
  PayphoneError,
  prepareButtonPayment,
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

/** The fields we read from Shopify's `orders/create` payload. */
export type OrderCreatedPayload = {
  admin_graphql_api_id?: string;
  id?: number | string;
  financial_status?: string;
  /** Comma-separated. */
  tags?: string;
};

export type LinkResult =
  | {status: 'linked'; order: string; link: string; emailed: boolean}
  | {
      status: 'skipped';
      order: string | null;
      reason: 'not-pending' | 'already-linked' | 'order-not-found' | 'no-order-id' | 'checkout-order';
    };

export type SettleResult =
  | {status: 'paid'; order: string; transactionId: number; authorizationCode?: string | null}
  | {
      status: 'skipped';
      order: string | null;
      reason:
        | 'sale-not-found'
        | 'not-approved'
        | 'unconfirmed'
        | 'unknown-client-tx'
        | 'order-not-found'
        | 'already-paid'
        | 'client-tx-mismatch'
        | 'transaction-id-mismatch'
        | 'amount-mismatch';
      detail?: string;
    };

/** Where PayPhone sends the customer after the hosted payment form. */
export type PayphoneReturnUrls = {responseUrl: string; cancellationUrl: string};

/**
 * The storefront routes PayPhone redirects to, on the origin the request
 * came in on (https://biothree.ec in production, localhost in dev). PayPhone
 * appends `?id=...&clientTransactionId=...` to the response URL itself; the
 * order id on the cancellation URL is ours, so the retry button knows which
 * order to pay.
 */
export function payphoneReturnUrls(origin: string, orderLegacyId: string): PayphoneReturnUrls {
  return {
    responseUrl: `${origin}/pago/payphone/respuesta`,
    cancellationUrl: `${origin}/pago/payphone/cancelado?pedido=${encodeURIComponent(orderLegacyId)}`,
  };
}

function payphoneAmounts(order: PaymentOrder) {
  return splitAmounts({
    totalCents: toCents(order.totalOutstanding.amount),
    taxCents: toCents(order.totalTax.amount),
    taxRate: order.taxRates[0] ?? null,
  });
}

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

function payloadTags(payload: OrderCreatedPayload): string[] {
  return (payload.tags ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/**
 * Creates and emails a PayPhone link for a freshly placed, unpaid order that
 * came through Shopify's own checkout. Orders from the storefront checkout
 * are skipped: they pay through the button flow and a second link would risk
 * a double charge. Safe to call more than once for the same order: the
 * second call finds the stored link and stops.
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
  if (payloadTags(payload).includes(TAG_CHECKOUT)) {
    return {status: 'skipped', order: orderId, reason: 'checkout-order'};
  }

  const order = await getOrder(env, orderId);
  if (!order) return {status: 'skipped', order: orderId, reason: 'order-not-found'};
  if (order.tags.includes(TAG_CHECKOUT)) {
    return {status: 'skipped', order: order.name, reason: 'checkout-order'};
  }
  if (order.displayFinancialStatus && order.displayFinancialStatus !== 'PENDING') {
    return {status: 'skipped', order: order.name, reason: 'not-pending'};
  }
  if (order.payphoneLink) {
    return {status: 'skipped', order: order.name, reason: 'already-linked'};
  }

  const amounts = payphoneAmounts(order);
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

export type StartPaymentResult = {
  /** PayPhone's hosted card form. Redirect the customer here. */
  url: string;
  clientTransactionId: string;
};

/**
 * Registers a PayPhone button payment for a pending order and records the
 * attempt on it. Every call is a new attempt (PayPhone refuses to reuse a
 * clientTransactionId), so call it once per "Pagar" click, not per page view.
 */
export async function startPayphonePayment(
  order: PaymentOrder,
  env: FlowEnv,
  urls: PayphoneReturnUrls,
): Promise<StartPaymentResult> {
  if (isOrderPaid(order)) {
    throw new PayphoneError(`Order ${order.name} is already paid`);
  }
  const amounts = payphoneAmounts(order);
  const reference = `Biothree ${order.name}`;

  let clientTransactionId = nextClientTransactionId(order.legacyResourceId, order.payphoneClientTx);
  // A previous attempt may have reached PayPhone without being recorded on
  // the order (e.g. Shopify hiccup after Prepare). Skip past it.
  for (let retry = 0; ; retry++) {
    try {
      const prepared = await prepareButtonPayment(env, {
        clientTransactionId,
        amounts,
        reference,
        responseUrl: urls.responseUrl,
        cancellationUrl: urls.cancellationUrl,
        email: order.email,
        phoneNumber: order.phone,
        documentId: order.documentId,
      });
      await savePaymentLink(env, order.id, {link: prepared.payWithCard, clientTransactionId});
      return {url: prepared.payWithCard, clientTransactionId};
    } catch (error) {
      const duplicate =
        error instanceof PayphoneError && error.code === ERROR_CODE_DUPLICATE_CLIENT_TX;
      if (!duplicate || retry >= 3) throw error;
      clientTransactionId = nextClientTransactionId(order.legacyResourceId, clientTransactionId);
    }
  }
}

/**
 * The checks between "PayPhone says this sale is approved" and "mark the
 * Shopify order paid". Shared by the redirect, the notification and the
 * reconcile job.
 */
async function settleApprovedSale(sale: PayphoneSale, env: FlowEnv): Promise<SettleResult> {
  if (!isApproved(sale)) {
    return {
      status: 'skipped',
      order: null,
      reason: 'not-approved',
      detail: [sale.transactionStatus, `(${sale.statusCode})`, sale.message ?? '']
        .join(' ')
        .trim(),
    };
  }

  const legacyId = orderIdFromClientTransactionId(sale.clientTransactionId);
  if (!legacyId) {
    return {status: 'skipped', order: null, reason: 'unknown-client-tx', detail: sale.clientTransactionId};
  }

  const order = await getOrder(env, orderGid(legacyId));
  if (!order) return {status: 'skipped', order: legacyId, reason: 'order-not-found'};
  if (isOrderPaid(order)) {
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
  return {
    status: 'paid',
    order: order.name,
    transactionId: sale.transactionId,
    authorizationCode: sale.authorizationCode ?? null,
  };
}

/**
 * The customer is back from PayPhone with `id` + `clientTransactionId`.
 * Confirms the transaction (mandatory: PayPhone reverses unconfirmed ones
 * after 5 minutes) and marks the order paid when the amount matches.
 * Reloading the page repeats the confirmation harmlessly.
 */
export async function confirmPayphonePayment(
  ref: {transactionId: number | string | null | undefined; clientTransactionId: string},
  env: FlowEnv,
): Promise<SettleResult> {
  if (ref.transactionId == null || ref.transactionId === '') {
    return {status: 'skipped', order: null, reason: 'sale-not-found'};
  }
  const sale = await confirmButtonPayment(env, {
    transactionId: ref.transactionId,
    clientTransactionId: ref.clientTransactionId,
  });
  if (!sale) return {status: 'skipped', order: null, reason: 'sale-not-found'};
  if (sale.clientTransactionId !== ref.clientTransactionId) {
    return {
      status: 'skipped',
      order: null,
      reason: 'client-tx-mismatch',
      detail: `asked for ${ref.clientTransactionId}, PayPhone has ${sale.clientTransactionId}`,
    };
  }
  return settleApprovedSale(sale, env);
}

/**
 * Marks the matching Shopify order paid if PayPhone confirms the transaction
 * is approved and the amount matches what the order still owes.
 *
 * Looks the sale up by our clientTransactionId first (the reliable endpoint)
 * and only by PayPhone's transactionId when that is all we have. When both
 * are given they must agree. With `confirm`, an approved button transaction
 * is also confirmed before settling, because an unconfirmed one is about to
 * be reversed.
 */
export async function settleTransaction(
  ref: {transactionId?: number | string | null; clientTransactionId?: string | null},
  env: FlowEnv,
  {confirm = false}: {confirm?: boolean} = {},
): Promise<SettleResult> {
  const hasTransactionId = ref.transactionId != null && ref.transactionId !== '';
  let sale: PayphoneSale | null = null;
  if (ref.clientTransactionId) {
    sale = await getSaleByClientTransactionId(env, ref.clientTransactionId);
  } else if (hasTransactionId) {
    sale = await getSaleByTransactionId(env, ref.transactionId as number | string);
  }
  if (!sale) return {status: 'skipped', order: null, reason: 'sale-not-found'};
  if (hasTransactionId && String(sale.transactionId) !== String(ref.transactionId)) {
    return {
      status: 'skipped',
      order: null,
      reason: 'transaction-id-mismatch',
      detail: `notified ${String(ref.transactionId)}, PayPhone has ${sale.transactionId}`,
    };
  }

  if (confirm && isApproved(sale)) {
    const confirmed = await confirmButtonPayment(env, {
      transactionId: sale.transactionId,
      clientTransactionId: sale.clientTransactionId,
    });
    if (!confirmed) {
      return {
        status: 'skipped',
        order: null,
        reason: 'unconfirmed',
        detail: `Confirm knows nothing about ${sale.transactionId}`,
      };
    }
    sale = confirmed;
  }

  return settleApprovedSale(sale, env);
}

export type ReconcileResult = {
  checked: number;
  paid: number;
  results: Array<{order: string; result: SettleResult['status']; reason?: string}>;
};

/**
 * Sweeps pending orders that have a PayPhone attempt and settles any PayPhone
 * reports as approved. This is the safety net for when the customer never
 * made it back to the response page, or PayPhone's notification doesn't
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
      const result = await settleTransaction({clientTransactionId}, env, {
        confirm: order.tags.includes(TAG_CHECKOUT),
      });
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
