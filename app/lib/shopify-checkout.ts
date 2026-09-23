// Turns the storefront cart into a real Shopify order without Shopify's
// hosted checkout, so the customer can be sent straight to PayPhone.
// Server-only (Admin API).
//
// Draft orders do the maths: `draftOrderCalculate` prices the cart for an
// address (taxes from the store's tax settings, shipping rates from its
// shipping zones, discount codes honoured) and `draftOrderCreate` +
// `draftOrderComplete` turn the same input into an order that is pending
// payment, reserving inventory exactly like an order placed through
// Shopify's checkout. "Pending" is expressed as "Due on receipt" payment
// terms when the app holds `write_payment_terms` (Shopify's current way) and
// with draftOrderComplete's older `paymentPending` flag otherwise. The order
// is tagged `payphone-checkout` from birth so the orders/create webhook
// leaves it to the button flow instead of emailing a payment link.

import {
  adminRequest,
  DOCUMENT_ATTRIBUTE_KEY,
  getAdminScopes,
  normalizeOrder,
  PAYMENT_ORDER_FRAGMENT,
  ShopifyAdminError,
  TAG_CHECKOUT,
  type AdminEnv,
  type PaymentOrder,
  type RawOrder,
} from '~/lib/shopify-admin';

export type CheckoutLine = {variantId: string; quantity: number};

export type CheckoutAddress = {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string | null;
  city: string;
  /** ISO 3166-2:EC code, e.g. "P" for Pichincha. */
  provinceCode: string;
  /** Province name. Shopify keeps no provinces for Ecuador, so it travels in the city. */
  province?: string | null;
  zip?: string | null;
  phone: string;
};

export type CheckoutInput = {
  lines: CheckoutLine[];
  email: string;
  phone: string;
  address: CheckoutAddress;
  discountCodes?: string[];
  documentId?: string | null;
  shippingRateHandle?: string | null;
};

export type Money = {amount: string; currencyCode: string};

export type ShippingRate = {handle: string; title: string; price: Money};

export type CheckoutQuote = {
  shippingRates: ShippingRate[];
  /** The rate the totals below include, if a handle was given. */
  shippingLine: {title: string; price: Money} | null;
  subtotal: Money;
  discounts: Money;
  shipping: Money;
  tax: Money;
  total: Money;
  taxLines: Array<{title: string; rate: number; amount: Money}>;
  lineItems: Array<{
    title: string;
    variantTitle: string | null;
    quantity: number;
    total: Money;
  }>;
  warnings: string[];
};

type MoneyBag = {shopMoney: Money};

type RawCalculatedDraftOrder = {
  availableShippingRates: Array<{handle: string; title: string; price: Money}>;
  shippingLine: {title: string; originalPriceSet: MoneyBag} | null;
  subtotalPriceSet: MoneyBag;
  totalDiscountsSet: MoneyBag;
  totalShippingPriceSet: MoneyBag;
  totalTaxSet: MoneyBag;
  totalPriceSet: MoneyBag;
  taxLines: Array<{title: string; rate: number | null; priceSet: MoneyBag}>;
  lineItems: Array<{
    title: string;
    variantTitle: string | null;
    quantity: number;
    discountedTotalSet: MoneyBag;
  }>;
  warnings: Array<{message: string}>;
};

type UserError = {field?: string[] | null; message: string};

const CALCULATED_FIELDS = `
  availableShippingRates { handle title price { amount currencyCode } }
  shippingLine { title originalPriceSet { shopMoney { amount currencyCode } } }
  subtotalPriceSet { shopMoney { amount currencyCode } }
  totalDiscountsSet { shopMoney { amount currencyCode } }
  totalShippingPriceSet { shopMoney { amount currencyCode } }
  totalTaxSet { shopMoney { amount currencyCode } }
  totalPriceSet { shopMoney { amount currencyCode } }
  taxLines { title rate priceSet { shopMoney { amount currencyCode } } }
  lineItems { title variantTitle quantity discountedTotalSet { shopMoney { amount currencyCode } } }
  warnings { message }
`;

export class CheckoutError extends Error {
  /** Surfaced to the customer when true; otherwise a generic message is shown. */
  userFacing: boolean;

  constructor(message: string, userFacing = false) {
    super(message);
    this.name = 'CheckoutError';
    this.userFacing = userFacing;
  }
}

function firstUserError(errors: UserError[] | undefined): string | null {
  return errors?.length ? errors.map((error) => error.message).join('; ') : null;
}

/** The DraftOrderInput both the quote and the real order are built from. */
export function buildDraftOrderInput(input: CheckoutInput): Record<string, unknown> {
  // Shopify's address model has no provinces for Ecuador (provinceCode is
  // accepted and dropped), so the province rides along in the city field,
  // which is what ends up on the shipping label.
  const city = input.address.province
    ? `${input.address.city}, ${input.address.province}`
    : input.address.city;
  const address = {
    firstName: input.address.firstName,
    lastName: input.address.lastName,
    address1: input.address.address1,
    ...(input.address.address2 ? {address2: input.address.address2} : {}),
    city,
    provinceCode: input.address.provinceCode,
    ...(input.address.zip ? {zip: input.address.zip} : {}),
    countryCode: 'EC',
    phone: input.address.phone,
  };
  const discountCodes = (input.discountCodes ?? []).filter(Boolean);

  return {
    lineItems: input.lines.map((line) => ({
      variantId: line.variantId,
      quantity: line.quantity,
    })),
    email: input.email,
    phone: input.phone,
    shippingAddress: address,
    billingAddress: address,
    ...(discountCodes.length ? {discountCodes} : {}),
    ...(input.documentId
      ? {customAttributes: [{key: DOCUMENT_ATTRIBUTE_KEY, value: input.documentId}]}
      : {}),
    tags: [TAG_CHECKOUT],
    ...(input.shippingRateHandle
      ? {shippingLine: {shippingRateHandle: input.shippingRateHandle}}
      : {}),
  };
}

function normalizeQuote(raw: RawCalculatedDraftOrder): CheckoutQuote {
  return {
    shippingRates: raw.availableShippingRates.map((rate) => ({
      handle: rate.handle,
      title: rate.title,
      price: rate.price,
    })),
    shippingLine: raw.shippingLine
      ? {title: raw.shippingLine.title, price: raw.shippingLine.originalPriceSet.shopMoney}
      : null,
    subtotal: raw.subtotalPriceSet.shopMoney,
    discounts: raw.totalDiscountsSet.shopMoney,
    shipping: raw.totalShippingPriceSet.shopMoney,
    tax: raw.totalTaxSet.shopMoney,
    total: raw.totalPriceSet.shopMoney,
    taxLines: raw.taxLines.map((line) => ({
      title: line.title,
      rate: line.rate ?? 0,
      amount: line.priceSet.shopMoney,
    })),
    lineItems: raw.lineItems.map((line) => ({
      title: line.title,
      variantTitle: line.variantTitle,
      quantity: line.quantity,
      total: line.discountedTotalSet.shopMoney,
    })),
    warnings: raw.warnings.map((warning) => warning.message),
  };
}

/**
 * Prices the cart for an address without creating anything. Shipping rates
 * come from the store's zones; pass `shippingRateHandle` to have the totals
 * include one of them.
 */
export async function quoteCheckout(env: AdminEnv, input: CheckoutInput): Promise<CheckoutQuote> {
  const data = await adminRequest<{
    draftOrderCalculate: {
      calculatedDraftOrder: RawCalculatedDraftOrder | null;
      userErrors: UserError[];
    };
  }>(
    env,
    `#graphql
      mutation QuoteCheckout($input: DraftOrderInput!) {
        draftOrderCalculate(input: $input) {
          calculatedDraftOrder { ${CALCULATED_FIELDS} }
          userErrors { field message }
        }
      }
    `,
    {input: buildDraftOrderInput(input)},
  );
  const userError = firstUserError(data.draftOrderCalculate.userErrors);
  if (userError) throw new CheckoutError(`draftOrderCalculate: ${userError}`, true);
  if (!data.draftOrderCalculate.calculatedDraftOrder) {
    throw new CheckoutError('draftOrderCalculate returned nothing');
  }
  return normalizeQuote(data.draftOrderCalculate.calculatedDraftOrder);
}

type PaymentTermsTemplate = {id: string; paymentTermsType: string};
let cachedReceiptTemplate: {key: string; id: string} | null = null;

/** Test hook. */
export function resetPaymentTermsCache() {
  cachedReceiptTemplate = null;
}

/** Scope that lets an app put payment terms on a draft order. */
export const PAYMENT_TERMS_SCOPE = 'write_payment_terms';

/**
 * "Due on receipt" is how a draft order becomes an order that is pending
 * payment in Shopify's current model (the `paymentPending` flag on
 * draftOrderComplete is deprecated). Shopify ships the template with every
 * store; its id is looked up once per worker rather than hard-coded.
 */
export async function getReceiptPaymentTermsTemplateId(env: AdminEnv): Promise<string> {
  const key = env.PUBLIC_STORE_DOMAIN;
  if (cachedReceiptTemplate?.key === key) return cachedReceiptTemplate.id;

  const data = await adminRequest<{paymentTermsTemplates: PaymentTermsTemplate[]}>(
    env,
    `#graphql
      query ReceiptPaymentTerms { paymentTermsTemplates { id paymentTermsType } }
    `,
  );
  const template = data.paymentTermsTemplates.find(
    (candidate) => candidate.paymentTermsType === 'RECEIPT',
  );
  if (!template) throw new ShopifyAdminError('No "Due on receipt" payment terms template');
  cachedReceiptTemplate = {key, id: template.id};
  return template.id;
}

/**
 * Whether to express "pending payment" through payment terms. Setting them
 * needs `write_payment_terms`; without it Shopify answers "The user must
 * have access to set payment terms". Static tokens can't tell, and default
 * to the flag, which every draft-orders app can use.
 */
export async function shouldUsePaymentTerms(env: AdminEnv): Promise<boolean> {
  const scopes = await getAdminScopes(env);
  return scopes?.includes(PAYMENT_TERMS_SCOPE) ?? false;
}

/**
 * Creates the order for a checkout: a draft order completed as pending
 * payment. Resolves to the same order shape the payment flow works with.
 * The draft is deleted again if completion fails, so no stray drafts pile up
 * in the admin.
 */
export async function createPendingOrder(
  env: AdminEnv,
  input: CheckoutInput & {shippingRateHandle: string},
): Promise<PaymentOrder> {
  const usePaymentTerms = await shouldUsePaymentTerms(env);
  const paymentTerms = usePaymentTerms
    ? {paymentTerms: {paymentTermsTemplateId: await getReceiptPaymentTermsTemplateId(env)}}
    : {};
  const created = await adminRequest<{
    draftOrderCreate: {draftOrder: {id: string; name: string} | null; userErrors: UserError[]};
  }>(
    env,
    `#graphql
      mutation CreateCheckoutDraft($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder { id name }
          userErrors { field message }
        }
      }
    `,
    {input: {...buildDraftOrderInput(input), ...paymentTerms}},
  );
  const createError = firstUserError(created.draftOrderCreate.userErrors);
  if (createError) throw new CheckoutError(`draftOrderCreate: ${createError}`, true);
  const draft = created.draftOrderCreate.draftOrder;
  if (!draft) throw new CheckoutError('draftOrderCreate returned no draft order');

  let completed: {
    draftOrderComplete: {draftOrder: {order: RawOrder | null} | null; userErrors: UserError[]};
  };
  try {
    completed = await adminRequest(
      env,
      `#graphql
        ${PAYMENT_ORDER_FRAGMENT}
        mutation CompleteCheckoutDraft($id: ID!, $paymentPending: Boolean) {
          draftOrderComplete(id: $id, paymentPending: $paymentPending) {
            draftOrder { id order { ...PaymentOrder } }
            userErrors { field message }
          }
        }
      `,
      // With payment terms on the draft the order is pending by itself; the
      // deprecated flag is only sent when terms couldn't be set.
      {id: draft.id, paymentPending: usePaymentTerms ? null : true},
    );
  } catch (error) {
    await deleteDraftOrder(env, draft.id);
    throw error;
  }
  const completeError = firstUserError(completed.draftOrderComplete.userErrors);
  const order = completed.draftOrderComplete.draftOrder?.order;
  if (completeError || !order) {
    await deleteDraftOrder(env, draft.id);
    throw new CheckoutError(
      completeError ? `draftOrderComplete: ${completeError}` : 'draftOrderComplete returned no order',
      Boolean(completeError),
    );
  }
  return normalizeOrder(order);
}

async function deleteDraftOrder(env: AdminEnv, id: string): Promise<void> {
  try {
    await adminRequest(
      env,
      `#graphql
        mutation DeleteCheckoutDraft($input: DraftOrderDeleteInput!) {
          draftOrderDelete(input: $input) { deletedId userErrors { message } }
        }
      `,
      {input: {id}},
    );
  } catch (error) {
    console.error(`Could not delete draft order ${id}:`, error);
  }
}
