// Only allowlisted commerce fields reach analytics; never spread a cart/order.
export const GA4_ID = 'G-R1SHYQ4PGG';
export const META_PIXEL_ID = '4647772138884151';
export const CONSENT_KEY = 'biothree:measurement-consent:v1';
export type Consent = {analytics: boolean; marketing: boolean; expires: number};
export type Item = {item_id: string; quantity: number; price?: number};
export type Purchase = {
  transaction_id: string; currency: string; value: number;
  tax: number; shipping: number; total: number; items: Item[];
};
export type Commerce = {currency: string; value: number; items: Item[]};

export function readConsent(storage?: Pick<Storage, 'getItem'>): Consent | null {
  try {
    const value: unknown = JSON.parse(storage?.getItem(CONSENT_KEY) || 'null');
    if (value && typeof value === 'object' && 'analytics' in value &&
      'marketing' in value && 'expires' in value &&
      typeof value.analytics === 'boolean' && typeof value.marketing === 'boolean' &&
      typeof value.expires === 'number' && value.expires > Date.now()) return value as Consent;
  } catch { /* Storage can be unavailable in private browsing. */ }
  return null;
}

export function analyticsAllowed() {
  if (typeof window === 'undefined') return false;
  try { return readConsent(window.localStorage)?.analytics === true; } catch { return false; }
}

export function safePage(raw: string) {
  const url = new URL(raw, 'https://biothree.ec');
  // Order IDs, account tokens, search terms and payment references are private.
  if (/^\/(account|search|pagar|api|test)(?:\/|$)/.test(url.pathname) ||
      (url.pathname.startsWith('/pago/') && url.pathname !== '/pago/confirmado')) return null;
  const clean = new URL(url.pathname, url.origin);
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const value = url.searchParams.get(key);
    if (value && /^[a-zA-Z0-9_ -]{1,100}$/.test(value)) clean.searchParams.set(key, value);
  }
  return clean.href;
}

export function metaPageAllowed(raw: string, referrer = '') {
  const url = new URL(raw);
  if (!['/', '/productos', '/products/biothree', '/cart', '/checkout', '/pago/confirmado'].includes(url.pathname)) return false;
  // Pixel reads the real URL itself. Never load it with private query fields.
  if ([...url.searchParams.keys()].some(key => !['utm_source','utm_medium','utm_campaign','utm_content','utm_term','Presentación'].includes(key))) return false;
  if (referrer) {
    const from = new URL(referrer);
    if (from.search || from.hash || (from.origin === url.origin && !safePage(from.href))) return false;
  }
  return true;
}

type OrderMeasurement = {
  legacyResourceId: string; displayFinancialStatus: string; taxesIncluded?: boolean;
  shippingLines?: {nodes: Array<{taxLines: Array<{priceSet: {shopMoney: {amount: string}}}>}>};
  totalPriceSet: {shopMoney: {amount: string; currencyCode: string}};
  totalTaxSet: {shopMoney: {amount: string}};
  totalShippingPriceSet: {shopMoney: {amount: string}};
  lineItems: {nodes: Array<{quantity: number; variant: {id: string} | null; discountedUnitPriceAfterAllDiscountsSet?: {shopMoney: {amount: string}}; taxLines?: Array<{priceSet: {shopMoney: {amount: string}}}>}>; pageInfo: {hasNextPage: boolean}};
};
export function purchaseFromOrder(order: OrderMeasurement | null): Purchase | null {
  if (!order || order.displayFinancialStatus !== 'PAID' || order.lineItems.pageInfo.hasNextPage) return null;
  const total = Number(order.totalPriceSet.shopMoney.amount);
  const tax = Number(order.totalTaxSet.shopMoney.amount);
  const shippingTax = order.taxesIncluded ? (order.shippingLines?.nodes || []).reduce((sum, line) => sum + line.taxLines.reduce((n, taxLine) => n + Number(taxLine.priceSet.shopMoney.amount), 0), 0) : 0;
  const shipping = Math.round((Number(order.totalShippingPriceSet.shopMoney.amount) - shippingTax) * 100) / 100;
  const value = Math.round((total - tax - shipping) * 100) / 100;
  if (![total, tax, shipping, value].every(n => Number.isFinite(n) && n >= 0)) return null;
  if (!/^[A-Z]{3}$/.test(order.totalPriceSet.shopMoney.currencyCode)) return null;
  const items = order.lineItems.nodes.map(line => {
    const includedTax = order.taxesIncluded ? (line.taxLines || []).reduce((sum, taxLine) => sum + Number(taxLine.priceSet.shopMoney.amount), 0) : 0;
    const unitPrice = line.discountedUnitPriceAfterAllDiscountsSet?.shopMoney.amount;
    return {item_id: line.variant?.id.split('/').pop() || '', quantity: line.quantity,
      ...(unitPrice !== undefined ? {price: Math.round((Number(unitPrice) - includedTax / line.quantity) * 1000000) / 1000000} : {})};
  });
  if (!items.length || items.some(item => !item.item_id || !Number.isInteger(item.quantity) || item.quantity < 1 || (item.price !== undefined && (!Number.isFinite(item.price) || item.price < 0)))) return null;
  return {transaction_id: `biothree-${order.legacyResourceId}`, currency: order.totalPriceSet.shopMoney.currencyCode,
    value, tax, shipping, total, items};
}

export const PURCHASE_QUERY = `#graphql
  query MeasurementOrder($id: ID!) {
    order(id: $id) {
      legacyResourceId displayFinancialStatus taxesIncluded
      totalPriceSet { shopMoney { amount currencyCode } }
      totalTaxSet { shopMoney { amount } }
      totalShippingPriceSet { shopMoney { amount } }
      shippingLines(first: 100) { nodes { taxLines { priceSet { shopMoney { amount } } } } }
      lineItems(first: 100) { nodes { quantity variant { id } discountedUnitPriceAfterAllDiscountsSet { shopMoney { amount } } taxLines { priceSet { shopMoney { amount } } } } pageInfo { hasNextPage } }
    }
  }
`;
export type PurchaseQuery = {order: OrderMeasurement | null};
