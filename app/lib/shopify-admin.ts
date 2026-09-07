// Minimal Admin GraphQL client for the payment-link flow. Server-only.
//
// Auth: a Dev Dashboard app (dev.shopify.com) installed on the store, with
// `read_orders` and `write_orders`. Its Client ID + Client Secret are
// exchanged for a 24h Admin API token via the client-credentials grant and
// cached in memory. A static SHOPIFY_ADMIN_API_TOKEN is also accepted for
// legacy admin-created custom apps.
//
// Everything the flow persists lives on the order itself (metafields + tags),
// so there is no database to keep in sync.

export const ADMIN_API_VERSION = '2025-07';

export const METAFIELD_NAMESPACE = 'biothree';
export const METAFIELD_LINK_KEY = 'payphone_link';
export const METAFIELD_CLIENT_TX_KEY = 'payphone_client_tx';
export const TAG_LINK_SENT = 'payphone-link';
export const TAG_PAID = 'payphone-paid';

export type AdminEnv = {
  PUBLIC_STORE_DOMAIN: string;
  /** Dev Dashboard app credentials (preferred). */
  SHOPIFY_CLIENT_ID?: string;
  SHOPIFY_CLIENT_SECRET?: string;
  /** Static token from a legacy admin-created custom app. */
  SHOPIFY_ADMIN_API_TOKEN?: string;
};

export class ShopifyAdminError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShopifyAdminError';
  }
}

/** True when the env holds enough to authenticate against the Admin API. */
export function hasAdminCredentials(env: Partial<AdminEnv>): boolean {
  return Boolean(
    env.PUBLIC_STORE_DOMAIN &&
      (env.SHOPIFY_ADMIN_API_TOKEN || (env.SHOPIFY_CLIENT_ID && env.SHOPIFY_CLIENT_SECRET)),
  );
}

type CachedToken = {key: string; token: string; expiresAt: number};
let cachedToken: CachedToken | null = null;

/** Test hook: forget the cached client-credentials token. */
export function resetAdminTokenCache() {
  cachedToken = null;
}

/**
 * Resolves an Admin API access token. Client-credentials tokens live 24h;
 * we refresh a minute early and keep one per store+client in module memory,
 * which on Oxygen means "per warm worker" — cheap and good enough.
 */
export async function getAdminAccessToken(env: AdminEnv): Promise<string> {
  if (env.SHOPIFY_ADMIN_API_TOKEN) return env.SHOPIFY_ADMIN_API_TOKEN;
  if (!env.SHOPIFY_CLIENT_ID || !env.SHOPIFY_CLIENT_SECRET) {
    throw new ShopifyAdminError(
      'Missing SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET (or SHOPIFY_ADMIN_API_TOKEN)',
    );
  }

  const key = `${env.PUBLIC_STORE_DOMAIN}:${env.SHOPIFY_CLIENT_ID}`;
  if (cachedToken && cachedToken.key === key && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const response = await fetch(`https://${env.PUBLIC_STORE_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.SHOPIFY_CLIENT_ID,
      client_secret: env.SHOPIFY_CLIENT_SECRET,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new ShopifyAdminError(
      `Client credentials grant ${response.status}: ${text.slice(0, 300)}`,
    );
  }
  const json = (await response.json()) as {access_token?: string; expires_in?: number};
  if (!json.access_token) throw new ShopifyAdminError('Client credentials grant returned no token');

  cachedToken = {
    key,
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return json.access_token;
}

type Money = {amount: string; currencyCode: string};

/** The slice of an order the payment flow needs. */
export type PaymentOrder = {
  id: string;
  legacyResourceId: string;
  name: string;
  email: string | null;
  displayFinancialStatus: string | null;
  taxesIncluded: boolean;
  totalPrice: Money;
  totalTax: {amount: string};
  totalOutstanding: Money;
  taxRates: number[];
  tags: string[];
  payphoneLink: string | null;
  payphoneClientTx: string | null;
};

const PAYMENT_ORDER_FRAGMENT = `#graphql
  fragment PaymentOrder on Order {
    id
    legacyResourceId
    name
    email
    displayFinancialStatus
    taxesIncluded
    totalPriceSet { shopMoney { amount currencyCode } }
    totalTaxSet { shopMoney { amount } }
    totalOutstandingSet { shopMoney { amount currencyCode } }
    taxLines { rate }
    tags
    payphoneLink: metafield(namespace: "${METAFIELD_NAMESPACE}", key: "${METAFIELD_LINK_KEY}") { value }
    payphoneClientTx: metafield(namespace: "${METAFIELD_NAMESPACE}", key: "${METAFIELD_CLIENT_TX_KEY}") { value }
  }
`;

type RawOrder = {
  id: string;
  legacyResourceId: string;
  name: string;
  email: string | null;
  displayFinancialStatus: string | null;
  taxesIncluded: boolean;
  totalPriceSet: {shopMoney: Money};
  totalTaxSet: {shopMoney: {amount: string}};
  totalOutstandingSet: {shopMoney: Money};
  taxLines: Array<{rate: number | null}>;
  tags: string[];
  payphoneLink: {value: string} | null;
  payphoneClientTx: {value: string} | null;
};

function normalizeOrder(raw: RawOrder): PaymentOrder {
  return {
    id: raw.id,
    legacyResourceId: raw.legacyResourceId,
    name: raw.name,
    email: raw.email,
    displayFinancialStatus: raw.displayFinancialStatus,
    taxesIncluded: raw.taxesIncluded,
    totalPrice: raw.totalPriceSet.shopMoney,
    totalTax: raw.totalTaxSet.shopMoney,
    totalOutstanding: raw.totalOutstandingSet.shopMoney,
    taxRates: raw.taxLines
      .map((line) => line.rate)
      .filter((rate): rate is number => typeof rate === 'number' && rate > 0),
    tags: raw.tags ?? [],
    payphoneLink: raw.payphoneLink?.value ?? null,
    payphoneClientTx: raw.payphoneClientTx?.value ?? null,
  };
}

export async function adminRequest<T>(
  env: AdminEnv,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const send = async (token: string) =>
    fetch(`https://${env.PUBLIC_STORE_DOMAIN}/admin/api/${ADMIN_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({query, variables}),
    });

  let response = await send(await getAdminAccessToken(env));
  if (response.status === 401 && !env.SHOPIFY_ADMIN_API_TOKEN) {
    // Cached token revoked or expired early: mint a fresh one and retry once.
    resetAdminTokenCache();
    response = await send(await getAdminAccessToken(env));
  }
  if (!response.ok) {
    const text = await response.text();
    throw new ShopifyAdminError(`Admin API ${response.status}: ${text.slice(0, 300)}`);
  }
  const json = (await response.json()) as {
    data?: T;
    errors?: Array<{message: string}>;
  };
  if (json.errors?.length) {
    throw new ShopifyAdminError(json.errors.map((error) => error.message).join('; '));
  }
  if (!json.data) throw new ShopifyAdminError('Admin API returned no data');
  return json.data;
}

function assertNoUserErrors(
  operation: string,
  userErrors: Array<{field?: string[] | null; message: string}> | undefined,
) {
  if (userErrors?.length) {
    throw new ShopifyAdminError(
      `${operation}: ${userErrors.map((error) => error.message).join('; ')}`,
    );
  }
}

export function orderGid(legacyId: string | number): string {
  return `gid://shopify/Order/${legacyId}`;
}

export async function getOrder(env: AdminEnv, id: string): Promise<PaymentOrder | null> {
  const data = await adminRequest<{order: RawOrder | null}>(
    env,
    `#graphql
      ${PAYMENT_ORDER_FRAGMENT}
      query PaymentOrder($id: ID!) { order(id: $id) { ...PaymentOrder } }
    `,
    {id},
  );
  return data.order ? normalizeOrder(data.order) : null;
}

/** Pending orders that already got a link, newest first. */
export async function findPendingPayphoneOrders(
  env: AdminEnv,
  first = 25,
): Promise<PaymentOrder[]> {
  const data = await adminRequest<{orders: {nodes: RawOrder[]}}>(
    env,
    `#graphql
      ${PAYMENT_ORDER_FRAGMENT}
      query PendingPayphoneOrders($first: Int!, $query: String!) {
        orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
          nodes { ...PaymentOrder }
        }
      }
    `,
    {first, query: `financial_status:pending tag:${TAG_LINK_SENT}`},
  );
  return data.orders.nodes.map(normalizeOrder);
}

export async function savePaymentLink(
  env: AdminEnv,
  orderId: string,
  {link, clientTransactionId}: {link: string; clientTransactionId: string},
): Promise<void> {
  const data = await adminRequest<{
    metafieldsSet: {userErrors: Array<{message: string}>};
    tagsAdd: {userErrors: Array<{message: string}>};
  }>(
    env,
    `#graphql
      mutation SavePaymentLink($metafields: [MetafieldsSetInput!]!, $id: ID!, $tags: [String!]!) {
        metafieldsSet(metafields: $metafields) { userErrors { field message } }
        tagsAdd(id: $id, tags: $tags) { userErrors { field message } }
      }
    `,
    {
      id: orderId,
      tags: [TAG_LINK_SENT],
      metafields: [
        {
          ownerId: orderId,
          namespace: METAFIELD_NAMESPACE,
          key: METAFIELD_LINK_KEY,
          type: 'single_line_text_field',
          value: link,
        },
        {
          ownerId: orderId,
          namespace: METAFIELD_NAMESPACE,
          key: METAFIELD_CLIENT_TX_KEY,
          type: 'single_line_text_field',
          value: clientTransactionId,
        },
      ],
    },
  );
  assertNoUserErrors('metafieldsSet', data.metafieldsSet.userErrors);
  assertNoUserErrors('tagsAdd', data.tagsAdd.userErrors);
}

/**
 * Emails the customer through Shopify's "Order invoice" notification, so the
 * message carries the store's branding and no third-party mailer is needed.
 */
export async function sendPaymentLinkEmail(
  env: AdminEnv,
  orderId: string,
  email: {to?: string | null; subject: string; customMessage: string},
): Promise<void> {
  const data = await adminRequest<{
    orderInvoiceSend: {userErrors: Array<{message: string}>};
  }>(
    env,
    `#graphql
      mutation SendPaymentLink($id: ID!, $email: EmailInput) {
        orderInvoiceSend(id: $id, email: $email) { userErrors { message } }
      }
    `,
    {
      id: orderId,
      email: {
        ...(email.to ? {to: email.to} : {}),
        subject: email.subject,
        customMessage: email.customMessage,
      },
    },
  );
  assertNoUserErrors('orderInvoiceSend', data.orderInvoiceSend.userErrors);
}

export async function markOrderPaid(env: AdminEnv, orderId: string): Promise<void> {
  const data = await adminRequest<{
    orderMarkAsPaid: {
      order: {displayFinancialStatus: string} | null;
      userErrors: Array<{message: string}>;
    };
  }>(
    env,
    `#graphql
      mutation MarkPaid($input: OrderMarkAsPaidInput!) {
        orderMarkAsPaid(input: $input) {
          order { id displayFinancialStatus }
          userErrors { field message }
        }
      }
    `,
    {input: {id: orderId}},
  );
  assertNoUserErrors('orderMarkAsPaid', data.orderMarkAsPaid.userErrors);
}

export async function addOrderTags(env: AdminEnv, orderId: string, tags: string[]): Promise<void> {
  const data = await adminRequest<{tagsAdd: {userErrors: Array<{message: string}>}}>(
    env,
    `#graphql
      mutation AddTags($id: ID!, $tags: [String!]!) {
        tagsAdd(id: $id, tags: $tags) { userErrors { field message } }
      }
    `,
    {id: orderId, tags},
  );
  assertNoUserErrors('tagsAdd', data.tagsAdd.userErrors);
}
