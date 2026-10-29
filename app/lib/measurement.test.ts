import {describe, expect, it, vi, afterEach} from 'vitest';
import {readConsent, safePage, metaPageAllowed, purchaseFromOrder} from './measurement';

const order = {
  legacyResourceId: '123', displayFinancialStatus: 'PAID',
  totalPriceSet: {shopMoney: {amount: '35.00', currencyCode: 'USD'}},
  totalTaxSet: {shopMoney: {amount: '4.00'}},
  totalShippingPriceSet: {shopMoney: {amount: '3.00'}},
  lineItems: {nodes: [{quantity: 2, variant: {id: 'gid://shopify/ProductVariant/456'}}], pageInfo: {hasNextPage: false}},
};

afterEach(() => vi.useRealTimers());

describe('verified purchase measurement', () => {
  it('uses paid order totals, separates tax/shipping and emits a stable transaction ID', () => {
    const receipt = purchaseFromOrder(order);
    expect(receipt).toEqual({transaction_id: 'biothree-123', currency: 'USD', value: 28, tax: 4,
      shipping: 3, total: 35, items: [{item_id: '456', quantity: 2}]});
    expect(purchaseFromOrder({...order})).toEqual(receipt);
  });
  it.each(['PENDING', 'PARTIALLY_PAID', 'VOIDED', 'REFUNDED', 'AUTHORIZED'])('does not count %s as a purchase', displayFinancialStatus => {
    expect(purchaseFromOrder({...order, displayFinancialStatus})).toBeNull();
  });
  it('rejects missing, incomplete, invalid and inconsistent monetary data', () => {
    expect(purchaseFromOrder(null)).toBeNull();
    expect(purchaseFromOrder({...order, lineItems: {...order.lineItems, pageInfo: {hasNextPage: true}}})).toBeNull();
    expect(purchaseFromOrder({...order, totalTaxSet: {shopMoney: {amount: '40'}}})).toBeNull();
    expect(purchaseFromOrder({...order, totalTaxSet: {shopMoney: {amount: 'NaN'}}})).toBeNull();
  });
  it('separates tax-inclusive shipping and discounted item prices', () => {
    const result = purchaseFromOrder({...order, taxesIncluded: true,
      shippingLines: {nodes: [{taxLines: [{priceSet: {shopMoney: {amount: '0.39'}}}]}]},
      lineItems: {nodes: [{quantity: 2, variant: {id: 'gid://shopify/ProductVariant/456'}, discountedUnitPriceAfterAllDiscountsSet: {shopMoney: {amount: '16'}}, taxLines: [{priceSet: {shopMoney: {amount: '3.61'}}}]}], pageInfo: {hasNextPage: false}}});
    expect(result?.shipping).toBe(2.61);
    expect(result?.value).toBe(28.39);
    expect(result?.items[0].price).toBe(14.195);
  });
  it('does not copy contact or health fields from an order', () => {
    const result = purchaseFromOrder({...order, ...{email: 'private@example.com', phone: '123', name: 'Private name', customAttributes: [{key: 'health', value: 'private'}]}});
    expect(JSON.stringify(result)).not.toMatch(/private|email|phone|customAttributes|health/i);
  });
});

describe('privacy boundaries', () => {
  it('requires a valid, unexpired explicit consent record', () => {
    expect(readConsent()).toBeNull();
    expect(readConsent({getItem: () => 'garbage'})).toBeNull();
    expect(readConsent({getItem: () => JSON.stringify({analytics: 'yes', marketing: true, expires: Date.now()+10000})})).toBeNull();
    expect(readConsent({getItem: () => {throw new Error('blocked');}})).toBeNull();
    const consent = {analytics: true, marketing: false, expires: Date.now()+10000};
    expect(readConsent({getItem: () => JSON.stringify(consent)})).toEqual(consent);
    expect(readConsent({getItem: () => JSON.stringify({...consent, expires: 1})})).toBeNull();
  });
  it('drops payment/account URLs and strips arbitrary queries and fragments', () => {
    for (const path of ['/pago/payphone/respuesta?id=secret', '/pagar/123', '/account/orders/123', '/search?q=condition']) {
      expect(safePage(`https://biothree.ec${path}`)).toBeNull();
    }
    expect(safePage('https://biothree.ec/products/biothree?email=private@example.com&utm_source=instagram#token')).toBe('https://biothree.ec/products/biothree?utm_source=instagram');
    expect(safePage('https://biothree.ec/pago/confirmado')).toBe('https://biothree.ec/pago/confirmado');
  });
  it('never loads Meta on health articles, payment references or private referrers', () => {
    expect(metaPageAllowed('https://biothree.ec/ciencia')).toBe(false);
    expect(metaPageAllowed('https://biothree.ec/products/biothree?email=private')).toBe(false);
    expect(metaPageAllowed('https://biothree.ec/pago/confirmado', 'https://biothree.ec/pago/payphone/respuesta?id=1')).toBe(false);
    expect(metaPageAllowed('https://biothree.ec/products/biothree?Presentaci%C3%B3n=Tabletas')).toBe(true);
  });
});
