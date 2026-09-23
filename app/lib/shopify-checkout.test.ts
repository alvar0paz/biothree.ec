import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {AdminEnv} from './shopify-admin';
import {resetAdminTokenCache} from './shopify-admin';
import {
  buildDraftOrderInput,
  createPendingOrder,
  getReceiptPaymentTermsTemplateId,
  quoteCheckout,
  resetPaymentTermsCache,
  shouldUsePaymentTerms,
  type CheckoutInput,
} from './shopify-checkout';

const env: AdminEnv = {PUBLIC_STORE_DOMAIN: 'test.myshopify.com', SHOPIFY_ADMIN_API_TOKEN: 'shpat_test'};
const appEnv: AdminEnv = {
  PUBLIC_STORE_DOMAIN: 'test.myshopify.com',
  SHOPIFY_CLIENT_ID: 'cid',
  SHOPIFY_CLIENT_SECRET: 'csecret',
};

const input: CheckoutInput = {
  lines: [{variantId: 'gid://shopify/ProductVariant/1', quantity: 2}],
  email: 'cliente@example.com',
  phone: '+593991234567',
  address: {
    firstName: 'Ana',
    lastName: 'Pérez',
    address1: 'Av. Amazonas N24-03',
    address2: null,
    city: 'Quito',
    provinceCode: 'P',
    province: 'Pichincha',
    zip: null,
    phone: '+593991234567',
  },
  discountCodes: ['BIENVENIDA', ''],
  documentId: '1710034065',
};

const RATE = {handle: 'rate-standard', title: 'Standard', price: {amount: '0.0', currencyCode: 'USD'}};

function calculated(overrides: Record<string, unknown> = {}) {
  const money = (amount: string) => ({shopMoney: {amount, currencyCode: 'USD'}});
  return {
    availableShippingRates: [RATE],
    shippingLine: null,
    subtotalPriceSet: money('57.9'),
    totalDiscountsSet: money('0.0'),
    totalShippingPriceSet: money('0.0'),
    totalTaxSet: money('6.95'),
    totalPriceSet: money('64.85'),
    taxLines: [{title: 'VAT', rate: 0.12, priceSet: money('6.95')}],
    lineItems: [{title: 'Bio-Three', variantTitle: 'Tabletas', quantity: 2, discountedTotalSet: money('57.9')}],
    warnings: [],
    ...overrides,
  };
}

function rawOrder() {
  return {
    id: 'gid://shopify/Order/6123456789012',
    legacyResourceId: '6123456789012',
    name: '#1002',
    email: 'cliente@example.com',
    phone: '+593991234567',
    customAttributes: [{key: 'Cédula / RUC', value: '1710034065'}],
    displayFinancialStatus: 'PENDING',
    taxesIncluded: false,
    totalPriceSet: {shopMoney: {amount: '64.85', currencyCode: 'USD'}},
    totalTaxSet: {shopMoney: {amount: '6.95'}},
    totalOutstandingSet: {shopMoney: {amount: '64.85', currencyCode: 'USD'}},
    taxLines: [{rate: 0.12}],
    tags: ['payphone-checkout'],
    payphoneLink: null,
    payphoneClientTx: null,
  };
}

type Call = {op: string | undefined; variables: Record<string, any>};

function mockAdmin(responses: {
  calculate?: () => unknown;
  create?: () => unknown;
  complete?: () => unknown;
  /** Scopes the token exchange reports (client-credentials env only). */
  scopes?: string;
}) {
  const calls: Call[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      if (String(input).endsWith('/admin/oauth/access_token')) {
        return Response.json({
          access_token: 'tok-1',
          scope: responses.scopes ?? 'read_all_orders,write_draft_orders,write_orders',
          expires_in: 86399,
        });
      }
      const body = JSON.parse(String(init?.body)) as {query: string; variables: Record<string, any>};
      const op = /(query|mutation) (\w+)/.exec(body.query)?.[2];
      calls.push({op, variables: body.variables});
      switch (op) {
        case 'QuoteCheckout':
          return Response.json({
            data: {
              draftOrderCalculate: responses.calculate?.() ?? {calculatedDraftOrder: calculated(), userErrors: []},
            },
          });
        case 'ReceiptPaymentTerms':
          return Response.json({
            data: {
              paymentTermsTemplates: [
                {id: 'gid://shopify/PaymentTermsTemplate/2', paymentTermsType: 'NET'},
                {id: 'gid://shopify/PaymentTermsTemplate/1', paymentTermsType: 'RECEIPT'},
              ],
            },
          });
        case 'CreateCheckoutDraft':
          return Response.json({
            data: {
              draftOrderCreate: responses.create?.() ?? {
                draftOrder: {id: 'gid://shopify/DraftOrder/1', name: '#D1'},
                userErrors: [],
              },
            },
          });
        case 'CompleteCheckoutDraft':
          return Response.json({
            data: {
              draftOrderComplete: responses.complete?.() ?? {
                draftOrder: {id: 'gid://shopify/DraftOrder/1', order: rawOrder()},
                userErrors: [],
              },
            },
          });
        case 'DeleteCheckoutDraft':
          return Response.json({data: {draftOrderDelete: {deletedId: 'gid://shopify/DraftOrder/1', userErrors: []}}});
        default:
          throw new Error(`Unhandled admin op: ${op}`);
      }
    }),
  );
  return calls;
}

beforeEach(() => {
  resetPaymentTermsCache();
  resetAdminTokenCache();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('buildDraftOrderInput', () => {
  it('maps the checkout to a DraftOrderInput Shopify accepts', () => {
    expect(buildDraftOrderInput({...input, shippingRateHandle: RATE.handle})).toEqual({
      lineItems: [{variantId: 'gid://shopify/ProductVariant/1', quantity: 2}],
      email: 'cliente@example.com',
      phone: '+593991234567',
      shippingAddress: {
        firstName: 'Ana',
        lastName: 'Pérez',
        address1: 'Av. Amazonas N24-03',
        // Shopify drops provinceCode for Ecuador, so the province rides in the city.
        city: 'Quito, Pichincha',
        provinceCode: 'P',
        countryCode: 'EC',
        phone: '+593991234567',
      },
      billingAddress: expect.objectContaining({countryCode: 'EC'}),
      discountCodes: ['BIENVENIDA'],
      customAttributes: [{key: 'Cédula / RUC', value: '1710034065'}],
      tags: ['payphone-checkout'],
      shippingLine: {shippingRateHandle: RATE.handle},
    });
  });

  it('leaves out what the customer did not give', () => {
    const built = buildDraftOrderInput({...input, discountCodes: [], documentId: null});
    expect(built).not.toHaveProperty('discountCodes');
    expect(built).not.toHaveProperty('customAttributes');
    expect(built).not.toHaveProperty('shippingLine');
    expect(built.shippingAddress).not.toHaveProperty('address2');
    expect(built.shippingAddress).not.toHaveProperty('zip');
  });
});

describe('quoteCheckout', () => {
  it('normalises Shopify\'s calculated draft order', async () => {
    mockAdmin({});
    const quote = await quoteCheckout(env, input);
    expect(quote.shippingRates).toEqual([RATE]);
    expect(quote.total).toEqual({amount: '64.85', currencyCode: 'USD'});
    expect(quote.tax.amount).toBe('6.95');
    expect(quote.taxLines).toEqual([{title: 'VAT', rate: 0.12, amount: {amount: '6.95', currencyCode: 'USD'}}]);
    expect(quote.lineItems[0]).toMatchObject({title: 'Bio-Three', variantTitle: 'Tabletas', quantity: 2});
    expect(quote.shippingLine).toBeNull();
  });

  it('surfaces user errors as customer-facing', async () => {
    mockAdmin({
      calculate: () => ({calculatedDraftOrder: null, userErrors: [{field: ['lineItems'], message: 'Add at least 1 product'}]}),
    });
    await expect(quoteCheckout(env, input)).rejects.toMatchObject({
      name: 'CheckoutError',
      userFacing: true,
      message: expect.stringContaining('Add at least 1 product'),
    });
  });
});

describe('shouldUsePaymentTerms', () => {
  it('follows the scopes the store granted', async () => {
    mockAdmin({scopes: 'read_all_orders,write_draft_orders,write_orders,write_payment_terms'});
    expect(await shouldUsePaymentTerms(appEnv)).toBe(true);
    resetAdminTokenCache();
    mockAdmin({scopes: 'read_all_orders,write_draft_orders,write_orders'});
    expect(await shouldUsePaymentTerms(appEnv)).toBe(false);
  });

  it('defaults to the flag when the scopes are unknown (static token)', async () => {
    mockAdmin({});
    expect(await shouldUsePaymentTerms(env)).toBe(false);
  });
});

describe('createPendingOrder', () => {
  it('without the payment-terms scope: creates the draft and completes it as payment pending', async () => {
    const calls = mockAdmin({});
    const order = await createPendingOrder(appEnv, {...input, shippingRateHandle: RATE.handle});

    expect(calls.map((call) => call.op)).toEqual(['CreateCheckoutDraft', 'CompleteCheckoutDraft']);
    expect(calls[0].variables.input).toMatchObject({
      tags: ['payphone-checkout'],
      shippingLine: {shippingRateHandle: RATE.handle},
    });
    expect(calls[0].variables.input).not.toHaveProperty('paymentTerms');
    expect(calls[1].variables).toEqual({id: 'gid://shopify/DraftOrder/1', paymentPending: true});
    expect(order).toMatchObject({
      name: '#1002',
      legacyResourceId: '6123456789012',
      documentId: '1710034065',
      phone: '+593991234567',
      tags: ['payphone-checkout'],
    });
  });

  it('with the payment-terms scope: puts due-on-receipt terms on the draft instead', async () => {
    const calls = mockAdmin({scopes: 'write_draft_orders,write_orders,write_payment_terms'});
    await createPendingOrder(appEnv, {...input, shippingRateHandle: RATE.handle});

    expect(calls.map((call) => call.op)).toEqual([
      'ReceiptPaymentTerms',
      'CreateCheckoutDraft',
      'CompleteCheckoutDraft',
    ]);
    expect(calls[1].variables.input).toMatchObject({
      paymentTerms: {paymentTermsTemplateId: 'gid://shopify/PaymentTermsTemplate/1'},
    });
    expect(calls[2].variables).toEqual({id: 'gid://shopify/DraftOrder/1', paymentPending: null});
  });

  it('caches the payment terms template per store', async () => {
    const calls = mockAdmin({scopes: 'write_draft_orders,write_orders,write_payment_terms'});
    await createPendingOrder(appEnv, {...input, shippingRateHandle: RATE.handle});
    await createPendingOrder(appEnv, {...input, shippingRateHandle: RATE.handle});
    expect(calls.filter((call) => call.op === 'ReceiptPaymentTerms')).toHaveLength(1);
    expect(await getReceiptPaymentTermsTemplateId(appEnv)).toBe('gid://shopify/PaymentTermsTemplate/1');
  });

  it('deletes the draft and throws when completion fails', async () => {
    const calls = mockAdmin({
      complete: () => ({draftOrder: null, userErrors: [{field: null, message: 'Invalid payment gateway'}]}),
    });
    await expect(createPendingOrder(env, {...input, shippingRateHandle: RATE.handle})).rejects.toThrow(
      /Invalid payment gateway/,
    );
    expect(calls.map((call) => call.op)).toContain('DeleteCheckoutDraft');
  });

  it('throws before completing when the draft cannot be created', async () => {
    const calls = mockAdmin({
      create: () => ({draftOrder: null, userErrors: [{field: ['discountCodes'], message: 'Discount code invalid'}]}),
    });
    await expect(createPendingOrder(env, {...input, shippingRateHandle: RATE.handle})).rejects.toMatchObject({
      userFacing: true,
    });
    expect(calls.map((call) => call.op)).not.toContain('CompleteCheckoutDraft');
  });
});
