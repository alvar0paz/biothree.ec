// PayPhone (Ecuador) client for the payment-link flow. Server-only: it needs
// the private API token, so never import it from a component.
//
// Docs: https://docs.payphone.app/api-link (create links),
//       https://docs.payphone.app/api-sale (query a transaction),
//       https://docs.payphone.app/notificacion-externa (their webhook).
//
// Money is integer cents everywhere in this module. PayPhone validates that
// `amount === amountWithoutTax + amountWithTax + tax + service + tip`, and
// `splitAmounts` guarantees that identity holds after rounding.

export const PAYPHONE_API_BASE = 'https://pay.payphonetodoesposible.com';

/** PayPhone caps `clientTransactionId` at 15 characters on the Links API. */
export const CLIENT_TX_MAX_LENGTH = 15;

/** Links stop working after this many hours unless overridden via env. */
export const DEFAULT_LINK_EXPIRE_HOURS = 24;

export type PayphoneEnv = {
  PAYPHONE_API_TOKEN: string;
  PAYPHONE_STORE_ID: string;
  PAYPHONE_LINK_EXPIRE_HOURS?: string;
};

export type PayphoneAmounts = {
  amount: number;
  amountWithTax: number;
  amountWithoutTax: number;
  tax: number;
};

/** Shape of GET /api/Sale/{id} and GET /api/Sale/client/{clientTxId}. */
export type PayphoneSale = {
  transactionId: number;
  clientTransactionId: string;
  transactionStatus: string;
  statusCode: number;
  amount: number;
  currency?: string;
  authorizationCode?: string;
  date?: string;
  email?: string;
  phoneNumber?: string;
  document?: string;
  reference?: string;
  storeName?: string;
};

export const PAYPHONE_STATUS = {
  PENDING: 1,
  REJECTED: 2,
  APPROVED: 3,
} as const;

export class PayphoneError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PayphoneError';
  }
}

export function isApproved(
  sale: Pick<PayphoneSale, 'statusCode' | 'transactionStatus'>,
): boolean {
  return (
    sale.statusCode === PAYPHONE_STATUS.APPROVED ||
    sale.transactionStatus === 'Approved'
  );
}

/** "28.95" → 2895. Throws on garbage so a bad amount never reaches PayPhone. */
export function toCents(value: string | number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new PayphoneError(`Invalid money amount: ${String(value)}`);
  }
  return Math.round(parsed * 100);
}

/**
 * Splits an order total into the components PayPhone wants. `taxRate` is a
 * fraction (0.15 for 15% IVA). Without a rate, everything except the tax is
 * treated as taxable, which is right for a single-rate store.
 */
export function splitAmounts({
  totalCents,
  taxCents,
  taxRate,
}: {
  totalCents: number;
  taxCents: number;
  taxRate?: number | null;
}): PayphoneAmounts {
  if (!Number.isInteger(totalCents) || totalCents <= 0) {
    throw new PayphoneError(`Invalid total: ${totalCents}`);
  }
  const tax = Math.max(0, Math.min(Math.round(taxCents), totalCents));
  if (tax === 0) {
    return {amount: totalCents, amountWithTax: 0, amountWithoutTax: totalCents, tax};
  }

  const rawBase =
    taxRate && taxRate > 0 ? Math.round(tax / taxRate) : totalCents - tax;
  const amountWithTax = Math.max(0, Math.min(rawBase, totalCents - tax));
  const amountWithoutTax = totalCents - tax - amountWithTax;

  return {amount: totalCents, amountWithTax, amountWithoutTax, tax};
}

/**
 * The Shopify order's numeric id doubles as PayPhone's clientTransactionId,
 * so settling a payment needs no lookup table. A second attempt (expired
 * link) gets a `-2` suffix, which still fits in 15 characters.
 */
export function buildClientTransactionId(
  orderLegacyId: string | number,
  attempt = 1,
): string {
  const base = String(orderLegacyId).trim();
  if (!/^\d+$/.test(base)) {
    throw new PayphoneError(`Order id must be numeric: ${base}`);
  }
  const id = attempt > 1 ? `${base}-${attempt}` : base;
  if (id.length > CLIENT_TX_MAX_LENGTH) {
    throw new PayphoneError(`clientTransactionId too long: ${id}`);
  }
  return id;
}

/** Inverse of `buildClientTransactionId`. Null for ids we didn't mint. */
export function orderIdFromClientTransactionId(
  clientTransactionId: string,
): string | null {
  const match = /^(\d+)(?:-\d+)?$/.exec(clientTransactionId.trim());
  return match ? match[1] : null;
}

function authHeaders(env: PayphoneEnv): HeadersInit {
  return {
    Authorization: `Bearer ${env.PAYPHONE_API_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

export function linkExpireHours(env: PayphoneEnv): number {
  const parsed = Number(env.PAYPHONE_LINK_EXPIRE_HOURS);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_LINK_EXPIRE_HOURS;
}

/** POST /api/Links. Resolves to the payment URL PayPhone minted. */
export async function createPaymentLink(
  env: PayphoneEnv,
  input: {
    clientTransactionId: string;
    amounts: PayphoneAmounts;
    reference: string;
    expireInHours?: number;
    oneTime?: boolean;
  },
): Promise<string> {
  const body = {
    ...input.amounts,
    clientTransactionId: input.clientTransactionId,
    storeId: env.PAYPHONE_STORE_ID,
    currency: 'USD',
    reference: input.reference.slice(0, 100),
    oneTime: input.oneTime ?? true,
    expireIn: input.expireInHours ?? linkExpireHours(env),
  };

  const response = await fetch(`${PAYPHONE_API_BASE}/api/Links`, {
    method: 'POST',
    headers: authHeaders(env),
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new PayphoneError(
      `Links API ${response.status}: ${text.slice(0, 300)}`,
    );
  }

  // The API answers with the bare URL, sometimes JSON-quoted.
  const link = text.trim().replace(/^"|"$/g, '');
  if (!/^https?:\/\//.test(link)) {
    throw new PayphoneError(`Links API returned no URL: ${text.slice(0, 300)}`);
  }
  return link;
}

async function getSale(env: PayphoneEnv, path: string): Promise<PayphoneSale | null> {
  const response = await fetch(`${PAYPHONE_API_BASE}${path}`, {
    method: 'GET',
    headers: authHeaders(env),
  });
  if (response.status === 404) return null;
  const text = await response.text();
  if (!response.ok) {
    throw new PayphoneError(`Sale API ${response.status}: ${text.slice(0, 300)}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new PayphoneError(`Sale API returned non-JSON: ${text.slice(0, 300)}`);
  }
  const sale = parsed as Partial<PayphoneSale> | null;
  if (!sale || typeof sale.transactionId !== 'number' || !sale.clientTransactionId) {
    return null;
  }
  return sale as PayphoneSale;
}

/** GET /api/Sale/{transactionId} — PayPhone's own id. */
export function getSaleByTransactionId(env: PayphoneEnv, transactionId: number | string) {
  return getSale(env, `/api/Sale/${encodeURIComponent(String(transactionId))}`);
}

/** GET /api/Sale/client/{clientTransactionId} — our id. */
export function getSaleByClientTransactionId(env: PayphoneEnv, clientTransactionId: string) {
  return getSale(env, `/api/Sale/client/${encodeURIComponent(clientTransactionId)}`);
}
