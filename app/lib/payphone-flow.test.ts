import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
  confirmPayphonePayment,
  handleOrderCreated,
  payphoneReturnUrls,
  reconcilePendingOrders,
  settleTransaction,
  startPayphonePayment,
  type FlowEnv,
} from './payphone-flow';
import {normalizeOrder} from './shopify-admin';

const env: FlowEnv = {
  PUBLIC_STORE_DOMAIN: 'test.myshopify.com',
  SHOPIFY_ADMIN_API_TOKEN: 'shpat_test',
  PAYPHONE_API_TOKEN: 'pp_test',
  PAYPHONE_STORE_ID: 'store_1',
};

const ORDER_ID = '6123456789012';
const ORDER_GID = `gid://shopify/Order/${ORDER_ID}`;
const CARD_URL = 'https://pay.payphonetodoesposible.com/Anonymous/Index?paymentId=GCjd4uI8';

function rawOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: ORDER_GID,
    legacyResourceId: ORDER_ID,
    name: '#1001',
    email: 'cliente@example.com',
    phone: '+593991234567',
    customAttributes: [],
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

const checkoutOrder = (overrides: Record<string, unknown> = {}) =>
  rawOrder({
    tags: ['payphone-checkout'],
    customAttributes: [{key: 'Cédula / RUC', value: '1710034065'}],
    ...overrides,
  });

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
  confirm?: (body: {id: number; clientTxId: string}) => unknown | null;
  prepare?: (body: Record<string, unknown>) => Response | Record<string, unknown>;
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
    if (url.endsWith('/api/button/Prepare')) {
      const answer = handlers.prepare
        ? handlers.prepare(body as Record<string, unknown>)
        : {paymentId: 'GCjd4uI8', payWithCard: CARD_URL, payWithPayPhone: CARD_URL};
      return answer instanceof Response ? answer : Response.json(answer);
    }
    if (url.endsWith('/api/button/V2/Confirm')) {
      const sale = handlers.confirm ? handlers.confirm(body as {id: number; clientTxId: string}) : null;
      return sale
        ? Response.json(sale)
        : new Response('{"message":"La transacción no existe","errorCode":20}', {status: 404});
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

const payphoneCalls = (calls: Call[]) =>
  calls.filter((call) => call.url.includes('payphonetodoesposible')).map((call) => new URL(call.url).pathname);

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

  it('omits storeId from the link when the account has none configured', async () => {
    const {calls} = mockFetch({order: () => rawOrder()});
    const {PAYPHONE_STORE_ID: _unused, ...envWithoutStore} = env;
    await handleOrderCreated({admin_graphql_api_id: ORDER_GID, financial_status: 'pending'}, envWithoutStore);
    const linkCall = calls.find((call) => call.url.endsWith('/api/Links'));
    expect(linkCall?.body).not.toHaveProperty('storeId');
  });

  it('skips paid orders without calling PayPhone', async () => {
    const {calls} = mockFetch({order: () => rawOrder({displayFinancialStatus: 'PAID'})});
    const result = await handleOrderCreated({admin_graphql_api_id: ORDER_GID, financial_status: 'paid'}, env);
    expect(result).toMatchObject({status: 'skipped', reason: 'not-pending'});
    expect(calls).toHaveLength(0);
  });

  it('leaves storefront-checkout orders to the button flow (no link, no email)', async () => {
    // Tag visible in the webhook payload: not even an Admin call.
    const first = mockFetch({order: () => checkoutOrder()});
    const fromPayload = await handleOrderCreated(
      {admin_graphql_api_id: ORDER_GID, financial_status: 'pending', tags: 'vip, payphone-checkout'},
      env,
    );
    expect(fromPayload).toMatchObject({status: 'skipped', reason: 'checkout-order'});
    expect(first.calls).toHaveLength(0);

    // Tag only on the re-read order (payload without tags).
    const second = mockFetch({order: () => checkoutOrder()});
    const fromOrder = await handleOrderCreated({admin_graphql_api_id: ORDER_GID, financial_status: 'pending'}, env);
    expect(fromOrder).toMatchObject({status: 'skipped', reason: 'checkout-order'});
    expect(second.calls.some((call) => call.url.endsWith('/api/Links'))).toBe(false);
    expect(adminOps(second.calls)).toEqual(['PaymentOrder']);
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

describe('payphoneReturnUrls', () => {
  it('builds the response and cancellation URLs on the request origin', () => {
    expect(payphoneReturnUrls('https://biothree.ec', ORDER_ID)).toEqual({
      responseUrl: 'https://biothree.ec/pago/payphone/respuesta',
      cancellationUrl: `https://biothree.ec/pago/payphone/cancelado?pedido=${ORDER_ID}`,
    });
  });
});

describe('startPayphonePayment', () => {
  const urls = payphoneReturnUrls('https://biothree.ec', ORDER_ID);

  it('prepares the payment for the outstanding amount and records the attempt', async () => {
    const {calls} = mockFetch({});
    const order = normalizeOrder(checkoutOrder());

    const result = await startPayphonePayment(order, env, urls);

    expect(result).toEqual({url: CARD_URL, clientTransactionId: ORDER_ID});
    const prepare = calls.find((call) => call.url.endsWith('/api/button/Prepare'));
    expect(prepare?.body).toMatchObject({
      amount: 2895,
      tax: 378,
      amountWithTax: 2517,
      amountWithoutTax: 0,
      service: 0,
      tip: 0,
      clientTransactionId: ORDER_ID,
      reference: 'Biothree #1001',
      responseUrl: urls.responseUrl,
      cancellationUrl: urls.cancellationUrl,
      email: 'cliente@example.com',
      phoneNumber: '+593991234567',
      documentId: '1710034065',
    });
    expect(adminOps(calls)).toEqual(['SavePaymentLink']);
    const save = calls.find((call) => (call.body as AdminBody | null)?.query?.includes('SavePaymentLink'));
    const metafields = (save?.body as AdminBody).variables.metafields as Array<{key: string; value: string}>;
    expect(metafields).toEqual([
      expect.objectContaining({key: 'payphone_link', value: CARD_URL}),
      expect.objectContaining({key: 'payphone_client_tx', value: ORDER_ID}),
    ]);
  });

  it('uses a fresh attempt id after a previous attempt', async () => {
    const {calls} = mockFetch({});
    const order = normalizeOrder(checkoutOrder({payphoneClientTx: {value: `${ORDER_ID}-2`}}));
    const result = await startPayphonePayment(order, env, urls);
    expect(result.clientTransactionId).toBe(`${ORDER_ID}-3`);
    expect(calls.find((call) => call.url.endsWith('/api/button/Prepare'))?.body.clientTransactionId).toBe(
      `${ORDER_ID}-3`,
    );
  });

  it('skips past an id PayPhone already knows (attempt not recorded on the order)', async () => {
    const {calls} = mockFetch({
      prepare: (body) =>
        body.clientTransactionId === ORDER_ID
          ? new Response('{"message":"Ya existe una transacción","errorCode":23}', {status: 400})
          : {paymentId: 'p2', payWithCard: CARD_URL, payWithPayPhone: CARD_URL},
    });
    const result = await startPayphonePayment(normalizeOrder(checkoutOrder()), env, urls);
    expect(result.clientTransactionId).toBe(`${ORDER_ID}-2`);
    expect(calls.filter((call) => call.url.endsWith('/api/button/Prepare'))).toHaveLength(2);
  });

  it('propagates other PayPhone errors and refuses paid orders', async () => {
    mockFetch({prepare: () => new Response('{"message":"Validaciones fallidas","errorCode":800}', {status: 400})});
    await expect(startPayphonePayment(normalizeOrder(checkoutOrder()), env, urls)).rejects.toThrow(
      /Prepare API 400/,
    );

    const {calls} = mockFetch({});
    await expect(
      startPayphonePayment(normalizeOrder(checkoutOrder({displayFinancialStatus: 'PAID'})), env, urls),
    ).rejects.toThrow(/already paid/);
    expect(calls).toHaveLength(0);
  });
});

describe('confirmPayphonePayment', () => {
  const approved = {
    transactionId: 23178284,
    clientTransactionId: ORDER_ID,
    transactionStatus: 'Approved',
    statusCode: 3,
    amount: 2895,
    authorizationCode: 'W23178284',
    messageCode: 0,
    message: null,
  };

  it('confirms with PayPhone and marks the order paid on a matching approval', async () => {
    const {calls} = mockFetch({
      order: () => checkoutOrder({payphoneClientTx: {value: ORDER_ID}}),
      confirm: (body) => (body.id === 23178284 && body.clientTxId === ORDER_ID ? approved : null),
    });
    const result = await confirmPayphonePayment({transactionId: '23178284', clientTransactionId: ORDER_ID}, env);
    expect(result).toEqual({
      status: 'paid',
      order: '#1001',
      transactionId: 23178284,
      authorizationCode: 'W23178284',
    });
    expect(payphoneCalls(calls)).toEqual(['/api/button/V2/Confirm']);
    expect(adminOps(calls)).toEqual(['PaymentOrder', 'MarkPaid', 'AddTags']);
  });

  it('is harmless to reload: a paid order is reported as already paid without a second MarkPaid', async () => {
    const {calls} = mockFetch({
      order: () => checkoutOrder({displayFinancialStatus: 'PAID', tags: ['payphone-checkout', 'payphone-paid']}),
      confirm: () => approved,
    });
    const result = await confirmPayphonePayment({transactionId: 23178284, clientTransactionId: ORDER_ID}, env);
    expect(result).toMatchObject({status: 'skipped', reason: 'already-paid', order: '#1001'});
    expect(adminOps(calls)).toEqual(['PaymentOrder']);
  });

  it('reports rejected, unknown and mismatched transactions without touching the order', async () => {
    const cases: Array<{
      ref: {transactionId: string | null; clientTransactionId: string};
      confirm: unknown;
      order?: Record<string, unknown>;
      reason: string;
    }> = [
      {ref: {transactionId: null, clientTransactionId: ORDER_ID}, confirm: approved, reason: 'sale-not-found'},
      {ref: {transactionId: '1', clientTransactionId: ORDER_ID}, confirm: null, reason: 'sale-not-found'},
      {
        ref: {transactionId: '23178284', clientTransactionId: ORDER_ID},
        confirm: {...approved, statusCode: 2, transactionStatus: 'Canceled', message: 'Fondos insuficientes'},
        reason: 'not-approved',
      },
      {
        ref: {transactionId: '23178284', clientTransactionId: ORDER_ID},
        confirm: {...approved, clientTransactionId: '7000000000001'},
        reason: 'client-tx-mismatch',
      },
      {
        ref: {transactionId: '23178284', clientTransactionId: ORDER_ID},
        confirm: {...approved, amount: 100},
        reason: 'amount-mismatch',
      },
      {
        ref: {transactionId: '23178284', clientTransactionId: `${ORDER_ID}-2`},
        confirm: {...approved, clientTransactionId: `${ORDER_ID}-2`},
        order: {payphoneClientTx: {value: `${ORDER_ID}-3`}},
        reason: 'client-tx-mismatch',
      },
    ];
    for (const testCase of cases) {
      const {calls} = mockFetch({
        order: () => checkoutOrder(testCase.order),
        confirm: () => testCase.confirm,
      });
      const result = await confirmPayphonePayment(testCase.ref, env);
      expect(result, testCase.reason).toMatchObject({status: 'skipped', reason: testCase.reason});
      expect(adminOps(calls), testCase.reason).not.toContain('MarkPaid');
    }
  });

  it('lets a PayPhone outage bubble up so the page can retry within the window', async () => {
    mockFetch({});
    vi.mocked(fetch).mockImplementation(async () => new Response('down', {status: 503}));
    await expect(
      confirmPayphonePayment({transactionId: '23178284', clientTransactionId: ORDER_ID}, env),
    ).rejects.toThrow(/Confirm API 503/);
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
      sale: (path) => (path === `/api/Sale/client/${ORDER_ID}` ? approvedSale : null),
    });
    const result = await settleTransaction({transactionId: 45441137, clientTransactionId: ORDER_ID}, env);
    expect(result).toEqual({status: 'paid', order: '#1001', transactionId: 45441137, authorizationCode: null});
    expect(adminOps(calls)).toEqual(['PaymentOrder', 'MarkPaid', 'AddTags']);
  });

  it('prefers the by-client lookup and never calls the by-id endpoint when both ids are given', async () => {
    const {calls} = mockFetch({
      order: () => rawOrder(),
      sale: (path) => (path === `/api/Sale/client/${ORDER_ID}` ? approvedSale : null),
    });
    await settleTransaction({transactionId: 45441137, clientTransactionId: ORDER_ID}, env);
    expect(calls.some((call) => call.url.endsWith('/api/Sale/45441137'))).toBe(false);
  });

  it('falls back to the by-id lookup when only transactionId is known', async () => {
    const {calls} = mockFetch({
      order: () => rawOrder(),
      sale: (path) => (path === '/api/Sale/45441137' ? approvedSale : null),
    });
    const result = await settleTransaction({transactionId: 45441137}, env);
    expect(result.status).toBe('paid');
    expect(calls.some((call) => call.url.endsWith('/api/Sale/45441137'))).toBe(true);
  });

  it('treats a 401 on the by-id endpoint as not found instead of failing', async () => {
    mockFetch({order: () => rawOrder(), sale: () => null});
    const fetchMock = vi.mocked(fetch);
    const original = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (input, init) => {
      if (String(input).endsWith('/api/Sale/1')) {
        return new Response('{"message":"Su aplicación no esta autorizada"}', {status: 401});
      }
      return original(input, init);
    });
    const result = await settleTransaction({transactionId: 1}, env);
    expect(result).toMatchObject({status: 'skipped', reason: 'sale-not-found'});
  });

  it('rejects a notification whose transactionId disagrees with PayPhone', async () => {
    const {calls} = mockFetch({
      order: () => rawOrder(),
      sale: (path) => (path === `/api/Sale/client/${ORDER_ID}` ? approvedSale : null),
    });
    const result = await settleTransaction({transactionId: 999, clientTransactionId: ORDER_ID}, env);
    expect(result).toMatchObject({status: 'skipped', reason: 'transaction-id-mismatch'});
    expect(adminOps(calls)).not.toContain('MarkPaid');
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
      const result = await settleTransaction({transactionId: 45441137, clientTransactionId: ORDER_ID}, env);
      expect(result, testCase.reason).toMatchObject({status: 'skipped', reason: testCase.reason});
      expect(adminOps(calls), testCase.reason).not.toContain('MarkPaid');
    }
  });

  it('skips when the order no longer exists', async () => {
    mockFetch({order: () => null, sale: () => approvedSale});
    const result = await settleTransaction({clientTransactionId: ORDER_ID}, env);
    expect(result).toMatchObject({status: 'skipped', reason: 'order-not-found'});
  });

  it('confirms an approved button transaction before settling when asked to', async () => {
    const {calls} = mockFetch({
      order: () => checkoutOrder({payphoneClientTx: {value: ORDER_ID}}),
      sale: (path) => (path === `/api/Sale/client/${ORDER_ID}` ? approvedSale : null),
      confirm: (body) => (body.id === 45441137 ? {...approvedSale, authorizationCode: 'W1'} : null),
    });
    const result = await settleTransaction({clientTransactionId: ORDER_ID}, env, {confirm: true});
    expect(result).toMatchObject({status: 'paid', authorizationCode: 'W1'});
    expect(payphoneCalls(calls)).toEqual([`/api/Sale/client/${ORDER_ID}`, '/api/button/V2/Confirm']);
  });

  it('does not settle a button transaction PayPhone will not confirm', async () => {
    const {calls} = mockFetch({
      order: () => checkoutOrder(),
      sale: () => approvedSale,
      confirm: () => null,
    });
    const result = await settleTransaction({clientTransactionId: ORDER_ID}, env, {confirm: true});
    expect(result).toMatchObject({status: 'skipped', reason: 'unconfirmed'});
    expect(adminOps(calls)).not.toContain('MarkPaid');
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
    // Link-flow orders are settled from the Sale lookup alone.
    expect(payphoneCalls(calls)).not.toContain('/api/button/V2/Confirm');
  });

  it('confirms button transactions of storefront-checkout orders before settling', async () => {
    const clientTx = `${ORDER_ID}-2`;
    const sale = {transactionId: 9, clientTransactionId: clientTx, transactionStatus: 'Approved', statusCode: 3, amount: 2895};
    const {calls} = mockFetch({
      orders: () => [checkoutOrder({payphoneClientTx: {value: clientTx}})],
      order: () => checkoutOrder({payphoneClientTx: {value: clientTx}}),
      sale: (path) => (path === `/api/Sale/client/${clientTx}` ? sale : null),
      confirm: (body) => (body.id === 9 && body.clientTxId === clientTx ? sale : null),
    });
    const result = await reconcilePendingOrders(env);
    expect(result).toMatchObject({checked: 1, paid: 1});
    expect(payphoneCalls(calls)).toEqual([`/api/Sale/client/${clientTx}`, '/api/button/V2/Confirm']);
  });
});
