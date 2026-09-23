// PayPhone (Ecuador) client. Server-only: it needs the private API token, so
// never import it from a component.
//
// Two products of theirs are used:
//
// - "Botón de pago" (redirect flow, the checkout): POST /api/button/Prepare
//   registers a payment and returns PayPhone's hosted URLs. The customer pays
//   there and PayPhone sends them back to our `responseUrl` with
//   `?id=<transactionId>&clientTransactionId=<ours>`. We then MUST call
//   POST /api/button/V2/Confirm: PayPhone reverses any transaction that is not
//   confirmed within 5 minutes. Docs: https://docs.payphone.app/boton-de-pago
// - Payment links (legacy fallback for orders placed through Shopify's own
//   checkout): POST /api/Links mints a URL that is emailed to the customer.
//   Docs: https://docs.payphone.app/api-link
//
// GET /api/Sale/... (https://docs.payphone.app/api-sale) reads a transaction
// back by either id, which is what the reconcile job uses.
//
// Money is integer cents everywhere in this module. PayPhone validates that
// `amount === amountWithoutTax + amountWithTax + tax + service + tip`, and
// `splitAmounts` guarantees that identity holds after rounding.

export const PAYPHONE_API_BASE = 'https://pay.payphonetodoesposible.com';

/** PayPhone caps `clientTransactionId` at 15 characters on the Links API. */
export const CLIENT_TX_MAX_LENGTH = 15;

/** The button (Prepare) API accepts up to 50; verified on 2026-09-22. */
export const BUTTON_CLIENT_TX_MAX_LENGTH = 50;

/** Links stop working after this many hours unless overridden via env. */
export const DEFAULT_LINK_EXPIRE_HOURS = 24;

/** PayPhone's own error code for "clientTransactionId already used". */
export const ERROR_CODE_DUPLICATE_CLIENT_TX = 23;

/** PayPhone's own error code for "transaction does not exist". */
export const ERROR_CODE_TRANSACTION_NOT_FOUND = 20;

export type PayphoneEnv = {
  PAYPHONE_API_TOKEN: string;
  /** Optional per PayPhone's docs; accounts with one store can omit it. */
  PAYPHONE_STORE_ID?: string;
  PAYPHONE_LINK_EXPIRE_HOURS?: string;
};

export type PayphoneAmounts = {
  amount: number;
  amountWithTax: number;
  amountWithoutTax: number;
  tax: number;
};

/**
 * Shape shared by GET /api/Sale/{id}, GET /api/Sale/client/{clientTxId} and
 * POST /api/button/V2/Confirm.
 */
export type PayphoneSale = {
  transactionId: number;
  clientTransactionId: string;
  transactionStatus: string;
  statusCode: number;
  amount: number;
  currency?: string;
  authorizationCode?: string | null;
  date?: string;
  email?: string;
  phoneNumber?: string;
  document?: string;
  reference?: string;
  storeName?: string;
  cardBrand?: string | null;
  lastDigits?: string | null;
  /** Confirm only: bank/PayPhone message for rejected transactions. */
  message?: string | null;
  messageCode?: number | null;
};

/** What POST /api/button/Prepare answers. */
export type PayphonePrepareResult = {
  paymentId: string;
  /** Hosted card form; works without a PayPhone account. */
  payWithCard: string;
  /** Hosted flow for customers with the PayPhone app. */
  payWithPayPhone: string;
};

export const PAYPHONE_STATUS = {
  PENDING: 1,
  REJECTED: 2,
  APPROVED: 3,
} as const;

export class PayphoneError extends Error {
  /** PayPhone's `errorCode` when the body carried one. */
  code: number | null;

  constructor(message: string, code: number | null = null) {
    super(message);
    this.name = 'PayphoneError';
    this.code = code;
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
 * so settling a payment needs no lookup table. Every further attempt (expired
 * link, cancelled or rejected card payment) gets a `-N` suffix, because
 * PayPhone refuses to reuse an id. `maxLength` is the Links API cap by
 * default; button attempts pass the larger button cap.
 */
export function buildClientTransactionId(
  orderLegacyId: string | number,
  attempt = 1,
  maxLength = CLIENT_TX_MAX_LENGTH,
): string {
  const base = String(orderLegacyId).trim();
  if (!/^\d+$/.test(base)) {
    throw new PayphoneError(`Order id must be numeric: ${base}`);
  }
  if (!Number.isInteger(attempt) || attempt < 1) {
    throw new PayphoneError(`Invalid attempt number: ${attempt}`);
  }
  const id = attempt > 1 ? `${base}-${attempt}` : base;
  if (id.length > maxLength) {
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

/** "6123456789012-3" → 3, "6123456789012" → 1, anything else → 0. */
export function attemptFromClientTransactionId(clientTransactionId: string): number {
  const match = /^\d+(?:-(\d+))?$/.exec(clientTransactionId.trim());
  if (!match) return 0;
  return match[1] ? Number(match[1]) : 1;
}

/**
 * The id for the next button payment attempt of an order, given the last one
 * stored on it (or null for a first attempt). Ids from a different order are
 * ignored rather than trusted.
 */
export function nextClientTransactionId(
  orderLegacyId: string | number,
  previous: string | null | undefined,
): string {
  const base = String(orderLegacyId).trim();
  const attempt =
    previous && orderIdFromClientTransactionId(previous) === base
      ? attemptFromClientTransactionId(previous) + 1
      : 1;
  return buildClientTransactionId(base, attempt, BUTTON_CLIENT_TX_MAX_LENGTH);
}

function authHeaders(env: PayphoneEnv): HeadersInit {
  return {
    Authorization: `Bearer ${env.PAYPHONE_API_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

function errorFromBody(prefix: string, status: number, text: string): PayphoneError {
  let code: number | null = null;
  try {
    const parsed = JSON.parse(text) as {errorCode?: unknown};
    if (typeof parsed?.errorCode === 'number') code = parsed.errorCode;
  } catch {
    // Not JSON; keep the raw text in the message.
  }
  return new PayphoneError(`${prefix} ${status}: ${text.slice(0, 300)}`, code);
}

export function linkExpireHours(env: PayphoneEnv): number {
  const parsed = Number(env.PAYPHONE_LINK_EXPIRE_HOURS);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_LINK_EXPIRE_HOURS;
}

/**
 * POST /api/button/Prepare. Registers a payment for the checkout redirect
 * flow and resolves to PayPhone's hosted URLs. Nothing is charged until the
 * customer completes the form, which expires 10 minutes after it is opened.
 */
export async function prepareButtonPayment(
  env: PayphoneEnv,
  input: {
    clientTransactionId: string;
    amounts: PayphoneAmounts;
    reference: string;
    responseUrl: string;
    cancellationUrl: string;
    email?: string | null;
    phoneNumber?: string | null;
    documentId?: string | null;
  },
): Promise<PayphonePrepareResult> {
  const storeId = env.PAYPHONE_STORE_ID?.trim();
  const body = {
    ...input.amounts,
    service: 0,
    tip: 0,
    clientTransactionId: input.clientTransactionId,
    ...(storeId ? {storeId} : {}),
    currency: 'USD',
    reference: input.reference.slice(0, 100),
    responseUrl: input.responseUrl,
    cancellationUrl: input.cancellationUrl,
    ...(input.email ? {email: input.email} : {}),
    ...(input.phoneNumber ? {phoneNumber: input.phoneNumber} : {}),
    ...(input.documentId ? {documentId: input.documentId} : {}),
    lang: 'es',
    timeZone: -5,
  };

  const response = await fetch(`${PAYPHONE_API_BASE}/api/button/Prepare`, {
    method: 'POST',
    headers: authHeaders(env),
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw errorFromBody('Prepare API', response.status, text);

  let parsed: Partial<PayphonePrepareResult> | null = null;
  try {
    parsed = JSON.parse(text) as Partial<PayphonePrepareResult>;
  } catch {
    throw new PayphoneError(`Prepare API returned non-JSON: ${text.slice(0, 300)}`);
  }
  if (
    !parsed ||
    typeof parsed.paymentId !== 'string' ||
    typeof parsed.payWithCard !== 'string' ||
    !/^https:\/\//.test(parsed.payWithCard)
  ) {
    throw new PayphoneError(`Prepare API returned no payment URL: ${text.slice(0, 300)}`);
  }
  return {
    paymentId: parsed.paymentId,
    payWithCard: parsed.payWithCard,
    payWithPayPhone:
      typeof parsed.payWithPayPhone === 'string' ? parsed.payWithPayPhone : parsed.payWithCard,
  };
}

function parseSale(text: string, source: string): PayphoneSale | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new PayphoneError(`${source} returned non-JSON: ${text.slice(0, 300)}`);
  }
  const sale = parsed as Partial<PayphoneSale> | null;
  if (!sale || typeof sale.transactionId !== 'number' || !sale.clientTransactionId) {
    return null;
  }
  return sale as PayphoneSale;
}

/**
 * POST /api/button/V2/Confirm. Mandatory after the customer comes back from
 * PayPhone (unconfirmed transactions are reversed after 5 minutes) and safe
 * to repeat: it keeps answering the transaction's final state. Null when
 * PayPhone has no such transaction.
 */
export async function confirmButtonPayment(
  env: PayphoneEnv,
  ref: {transactionId: number | string; clientTransactionId: string},
): Promise<PayphoneSale | null> {
  const id = Number(ref.transactionId);
  if (!Number.isInteger(id) || id <= 0) return null;

  const response = await fetch(`${PAYPHONE_API_BASE}/api/button/V2/Confirm`, {
    method: 'POST',
    headers: authHeaders(env),
    body: JSON.stringify({id, clientTxId: ref.clientTransactionId}),
  });
  const text = await response.text();
  if (response.status === 404) return null;
  if (!response.ok) {
    const error = errorFromBody('Confirm API', response.status, text);
    if (error.code === ERROR_CODE_TRANSACTION_NOT_FOUND) return null;
    throw error;
  }
  return parseSale(text, 'Confirm API');
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
  const storeId = env.PAYPHONE_STORE_ID?.trim();
  const body = {
    ...input.amounts,
    clientTransactionId: input.clientTransactionId,
    ...(storeId ? {storeId} : {}),
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
  if (!response.ok) throw errorFromBody('Links API', response.status, text);

  // The API answers with the bare URL, sometimes JSON-quoted.
  const link = text.trim().replace(/^"|"$/g, '');
  if (!/^https?:\/\//.test(link)) {
    throw new PayphoneError(`Links API returned no URL: ${text.slice(0, 300)}`);
  }
  return link;
}

async function getSale(
  env: PayphoneEnv,
  path: string,
  {treat401AsMissing = false}: {treat401AsMissing?: boolean} = {},
): Promise<PayphoneSale | null> {
  const response = await fetch(`${PAYPHONE_API_BASE}${path}`, {
    method: 'GET',
    headers: authHeaders(env),
  });
  if (response.status === 404) return null;
  // GET /api/Sale/{id} answers 401 ("no autorizada para acceder a este
  // recurso") for ids outside this app's scope, so for that endpoint a 401 is
  // "not ours", not "bad token". The by-client lookup keeps 401 as an error.
  if (response.status === 401 && treat401AsMissing) return null;
  const text = await response.text();
  if (!response.ok) throw errorFromBody('Sale API', response.status, text);
  return parseSale(text, 'Sale API');
}

/**
 * GET /api/Sale/{transactionId} — PayPhone's own id. Less reliable than the
 * by-client lookup: PayPhone hides transactions outside the app's scope
 * behind a 401, which is mapped to null here.
 */
export function getSaleByTransactionId(env: PayphoneEnv, transactionId: number | string) {
  return getSale(env, `/api/Sale/${encodeURIComponent(String(transactionId))}`, {
    treat401AsMissing: true,
  });
}

/** GET /api/Sale/client/{clientTransactionId} — our id. */
export function getSaleByClientTransactionId(env: PayphoneEnv, clientTransactionId: string) {
  return getSale(env, `/api/Sale/client/${encodeURIComponent(clientTransactionId)}`);
}
