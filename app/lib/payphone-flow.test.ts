import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {handleOrderCreated, reconcilePendingOrders, settleTransaction, type FlowEnv} from './payphone-flow';

const env: FlowEnv = {
  PUBLIC_STORE_DOMAIN: 'test.myshopify.com',
  SHOPIFY_ADMIN_API_TOKEN: 'shpat_test',
  PAYPHONE_API_TOKEN: 'pp_test',
  PAYPHONE_STORE_ID: 'store_1',
};

const ORDER_ID = '6123456789012';
const ORDER_GID = `gid://shopify/Order/${ORDER_ID}`;

function rawOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: ORDER_GID,
    legacyResourceId: ORDER_ID,
    name: '#1001',
    email: 'cliente@example.com',
    displayFinancialStatus: 'PENDING',
    taxesIncluded: true,
    totalPriceSet: {shopMoney: {amount: '28.95', currencyCode: 'USD'}},
    totalTaxSet: {shopMoney: {amount: '3.78'}},
    totalOutstandingSet: {shopMoney: {amount: '28.95', currencyCode: 'USD'}},
    taxLines: [{rate: 0.15}],
    tags: [],
    payphoneLink: null,
    payphoneClientTx: null,
    ...overrides,
  };
}

type AdminBody = {query: string; variables: Record<string, any>};
type Call = {url: string; method: string; body: any};

/**
 * Routes fetch() by URL: Admin GraphQL calls are dispatched on the operation
 * name in the query, PayPhone calls on their path.
 */
function mockFetch(handlers: {
  order?: () => unknown;
  orders?: () => unknown[];
  sale?: (path: string) => unknown | null;
  linksStatus?: number;
  linksBody?: string;
}) {
  const calls: Call[] = [];
  const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const body = init?.body ? (JSON.parse(String(init.body)) as any) : null;
    calls.push({url, method: init?.method ?? 'GET', body});

    if (url.includes('/admin/api/')) {
      const query = (body as AdminBody).query;
      if (query.includes('query PaymentOrder')) {
        return Response.json({data: {order: handlers.order ? handlers.order() : null}});
      }
      if (query.includes('query PendingPayphoneOrders')) {
        return Response.json({data: {orders: {nodes: handlers.orders ? handlers.orders() : []}}});
      }
      if (query.includes('mutation SavePaymentLink')) {
        return Response.json({data: {metafieldsSet: {userErrors: []}, tagsAdd: {userErrors: []}}});
      }
      if (query.includes('mutation SendPaymentLink')) {
        return Response.json({data: {orderInvoiceSend: {userErrors: []}}});
      }
      if (query.includes('mutation MarkPaid')) {
        return Response.json({
          data: {orderMarkAsPaid: {order: {id: ORDER_GID, displayFinancialStatus: 'PAID'}, userErrors: []}},
        });
      }
      if (query.includes('mutation AddTags')) {
        return Response.json({data: {tagsAdd: {userErrors: []}}});
      }
      throw new Error(`Unhandled admin query: ${query.slice(0, 60)}`);
    }

    if (url.endsWith('/api/Links')) {
      return new Response(handlers.linksBody ?? '"https://payp.page.link/abc123"', {
        status: handlers.linksStatus ?? 200,
      });
    }
    if (url.includes('/api/Sale/')) {
      const sale = handlers.sale ? handlers.sale(new URL(url).pathname) : null;
      return sale ? Response.json(sale) : new Response('', {status: 404});
    }
    throw new Error(`Unhandled fetch: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return {calls, fetchMock};
}

const adminOps = (calls: Call[]) =>
  calls
    .filter((call) => call.url.includes('/admin/api/'))
    .map((call) => /(query|mutation) (\w+)/.exec((call.body as AdminBody).query)?.[2]);

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('handleOrderCreated', () => {
  it('creates a link, stores it on the order, and emails the customer', async () => {
    const {calls} = mockFetch({order: () => rawOrder()});

    const result = await handleOrderCreated(
      {admin_graphql_api_id: ORDER_GID, financial_status: 'pending'},
      env,
    );

    expect(result).toEqual({
      status: 'linked',
      order: '#1001',
      link: 'https://payp.page.link/abc123',
      emailed: true,
    });

    const linkCall = calls.find((call) => call.url.endsWith('/api/Links'));
    expect(linkCall?.body).toMatchObject({
      amount: 2895,
      tax: 378,
      amountWithTax: 2517,
      amountWithoutTax: 0,
      clientTransactionId: ORDER_ID,
      storeId: 'store_1',
      currency: 'USD',
      reference: 'Biothree #1001',
      oneTime: true,
      expireIn: 24,
    });
    expect(linkCall?.body).toSatisfy(
      (b: {amount: number; tax: number; amountWithTax: number; amountWithoutTax: number}) =>
        b.amount === b.tax + b.amountWithTax + b.amountWithoutTax,
    );

    expect(adminOps(calls)).toEqual(['PaymentOrder', 'SavePaymentLink', 'SendPaymentLink']);
    const emailCall = calls.find((call) =>
      (call.body as AdminBody | null)?.query?.includes('SendPaymentLink'),
    );
    const email = (emailCall?.body as AdminBody).variables.email as {to: string; customMessage: string};
    expect(email.to).toBe('cliente@example.com');
    expect(email.customMessage).toContain('https://payp.page.link/abc123');
  });

  it('skips paid orders without calling PayPhone', async () => {
    const {calls} = mockFetch({order: () => rawOrder({displayFinancialStatus: 'PAID'})});
    const result = await handleOrderCreated({admin_graphql_api_id: ORDER_GID, financial_status: 'paid'}, env);
    expect(result).toMatchObject({status: 'skipped', reason: 'not-pending'});
    expect(calls).toHaveLength(0);
  });

  it('is idempotent: a retry finds the stored link and stops', async () => {
    const {calls} = mockFetch({
      order: () => rawOrder({payphoneLink: {value: 'https://payp.page.link/old'}, payphoneClientTx: {value: ORDER_ID}}),
    });
    const result = await handleOrderCreated({admin_graphql_api_id: ORDER_GID, financial_status: 'pending'}, env);
    expect(result).toMatchObject({status: 'skipped', reason: 'already-linked'});
    expect(calls.some((call) => call.url.endsWith('/api/Links'))).toBe(false);
  });

  it('surfaces PayPhone link failures so Shopify retries the webhook', async () => {
    mockFetch({order: () => rawOrder(), linksStatus: 400, linksBody: '{"message":"Validaciones fallidas"}'});
    await expect(
      handleOrderCreated({admin_graphql_api_id: ORDER_GID, financial_status: 'pending'}, env),
    ).rejects.toThrow(/Links API 400/);
  });

  it('still reports the link when only the email fails', async () => {
    const {fetchMock} = mockFetch({order: () => rawOrder()});
    const original = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (input, init) => {
      if (init?.body && String(init.body).includes('SendPaymentLink')) {
        return Response.json({data: {orderInvoiceSend: {userErrors: [{message: 'No email'}]}}});
      }
      return original(input, init);
    });
    const result = await handleOrderCreated({admin_graphql_api_id: ORDER_GID, financial_status: 'pending'}, env);
    expect(result).toMatchObject({status: 'linked', emailed: false});
  });
});

describe('settleTransaction', () => {
  const approvedSale = {
    transactionId: 45441137,
    clientTransactionId: ORDER_ID,
    transactionStatus: 'Approved',
    statusCode: 3,
    amount: 2895,
    currency: 'USD',
  };

  it('marks the order paid when PayPhone confirms an approved, matching sale', async () => {
    const {calls} = mockFetch({
      order: () => rawOrder({payphoneClientTx: {value: ORDER_ID}}),
      sale: (path) => (path === '/api/Sale/45441137' ? approvedSale : null),
    });
    const result = await settleTransaction({transactionId: 45441137}, env);
    expect(result).toEqual({status: 'paid', order: '#1001', transactionId: 45441137});
    expect(adminOps(calls)).toEqual(['PaymentOrder', 'MarkPaid', 'AddTags']);
  });

  it('looks up by clientTransactionId when that is all we have', async () => {
    const {calls} = mockFetch({
      order: () => rawOrder(),
      sale: (path) => (path === `/api/Sale/client/${ORDER_ID}` ? approvedSale : null),
    });
    const result = await settleTransaction({clientTransactionId: ORDER_ID}, env);
    expect(result.status).toBe('paid');
    expect(calls.some((call) => call.url.endsWith(`/api/Sale/client/${ORDER_ID}`))).toBe(true);
  });

  it('never marks paid on a forged or mismatched notification', async () => {
    const cases: Array<{sale: unknown; order?: Record<string, unknown>; reason: string}> = [
      {sale: null, reason: 'sale-not-found'},
      {sale: {...approvedSale, statusCode: 1, transactionStatus: 'Pending'}, reason: 'not-approved'},
      {sale: {...approvedSale, clientTransactionId: 'ID-OTRO-001'}, reason: 'unknown-client-tx'},
      {sale: {...approvedSale, amount: 100}, reason: 'amount-mismatch'},
      {sale: approvedSale, order: {payphoneClientTx: {value: '9999999999999'}}, reason: 'client-tx-mismatch'},
      {sale: approvedSale, order: {displayFinancialStatus: 'PAID'}, reason: 'already-paid'},
      {sale: approvedSale, order: {tags: ['payphone-paid']}, reason: 'already-paid'},
    ];
    for (const testCase of cases) {
      const {calls} = mockFetch({order: () => rawOrder(testCase.order), sale: () => testCase.sale});
      const result = await settleTransaction({transactionId: 45441137}, env);
      expect(result, testCase.reason).toMatchObject({status: 'skipped', reason: testCase.reason});
      expect(adminOps(calls), testCase.reason).not.toContain('MarkPaid');
    }
  });

  it('skips when the order no longer exists', async () => {
    mockFetch({order: () => null, sale: () => approvedSale});
    const result = await settleTransaction({transactionId: 45441137}, env);
    expect(result).toMatchObject({status: 'skipped', reason: 'order-not-found'});
  });
});

describe('reconcilePendingOrders', () => {
  it('settles the approved ones and reports the rest', async () => {
    const other = rawOrder({
      id: 'gid://shopify/Order/7000000000001',
      legacyResourceId: '7000000000001',
      name: '#1002',
      payphoneClientTx: {value: '7000000000001'},
    });
    const {calls} = mockFetch({
      orders: () => [rawOrder({payphoneClientTx: {value: ORDER_ID}}), other],
      order: () => rawOrder({payphoneClientTx: {value: ORDER_ID}}),
      sale: (path) =>
        path === `/api/Sale/client/${ORDER_ID}`
          ? {transactionId: 1, clientTransactionId: ORDER_ID, transactionStatus: 'Approved', statusCode: 3, amount: 2895}
          : null,
    });

    const result = await reconcilePendingOrders(env);
    expect(result.checked).toBe(2);
    expect(result.paid).toBe(1);
    expect(result.results).toEqual([
      {order: '#1001', result: 'paid'},
      {order: '#1002', result: 'skipped', reason: 'sale-not-found'},
    ]);
    expect(adminOps(calls).filter((op) => op === 'MarkPaid')).toHaveLength(1);
  });
});
