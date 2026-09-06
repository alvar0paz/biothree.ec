// Bridges the marketing copy in ~/data/products.ts to the real Shopify product.
//
// Biothree is ONE product with ONE option ("Presentación") and TWO variants
// (Tabletas / Sobres). Each variant carries its own SKU, price and inventory.
// Shopify is the single source of truth for price and stock — we never mirror
// those numbers locally, because Shopify decrements inventory at checkout and
// any local copy would silently drift out of sync.
//
// If the product doesn't exist yet (empty admin, unlinked storefront, network
// blip), every helper here degrades to `variant: null` and the UI falls back to
// the Instagram CTA. The marketing site must never 500 because commerce is
// half-configured.

import type {Storefront} from '@shopify/hydrogen';
import type {CurrencyCode} from '@shopify/hydrogen/storefront-api-types';
import {products as presentationCopy, type Product} from '~/data/products';

/** Handle of the single Biothree product in the Shopify admin. */
export const BIOTHREE_PRODUCT_HANDLE = 'biothree';

/** Name of the product option that distinguishes the two presentations. */
export const PRESENTATION_OPTION_NAME = 'Presentación';

/** At or below this many units we nudge urgency instead of a plain "in stock". */
export const LOW_STOCK_THRESHOLD = 5;

// Mirrors MoneyV2 so these values can be handed straight to Hydrogen's <Money>.
type Money = {
  amount: string;
  currencyCode: CurrencyCode;
};

type StorefrontVariant = {
  id: string;
  title: string;
  sku: string | null;
  availableForSale: boolean;
  /**
   * Null unless the storefront access token carries the
   * `unauthenticated_read_product_inventory` scope. Treated as "unknown
   * quantity, but purchasable" rather than "out of stock".
   */
  quantityAvailable: number | null;
  price: Money;
  compareAtPrice: Money | null;
  selectedOptions: Array<{name: string; value: string}>;
  image: {
    id: string | null;
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
};

type BiothreeProductQueryResponse = {
  product: {
    id: string;
    title: string;
    handle: string;
    variants: {nodes: StorefrontVariant[]};
  } | null;
};

const BIOTHREE_PRODUCT_QUERY = `#graphql
  query BiothreeProduct(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      handle
      variants(first: 10) {
        nodes {
          id
          title
          sku
          availableForSale
          quantityAvailable
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
          image {
            id
            url
            altText
            width
            height
          }
        }
      }
    }
  }
` as const;

/**
 * Preview-only overrides so the commerce flow can be exercised against a
 * different product (e.g. Shopify's public mock.shop) while the real store is
 * unavailable. Read from env; production never sets these.
 *
 * - PREVIEW_PRODUCT_HANDLE: product handle to load instead of `biothree`.
 * - PREVIEW_OPTION_NAME: option name to match on instead of `Presentación`.
 * - PREVIEW_OPTION_VALUES: comma-separated option values, one per marketing
 *   presentation in `~/data/products` order (e.g. `Small,Medium`).
 */
type PreviewEnv = Partial<
  Pick<
    Env,
    'PREVIEW_PRODUCT_HANDLE' | 'PREVIEW_OPTION_NAME' | 'PREVIEW_OPTION_VALUES'
  >
>;

type ProductTarget = {
  handle: string;
  optionName: string;
  /** Option value per presentation, positional. */
  optionValues: string[];
};

function resolveTarget(env?: PreviewEnv): ProductTarget {
  const handle = env?.PREVIEW_PRODUCT_HANDLE?.trim();
  if (!handle) {
    return {
      handle: BIOTHREE_PRODUCT_HANDLE,
      optionName: PRESENTATION_OPTION_NAME,
      optionValues: presentationCopy.map((product) => product.optionValue),
    };
  }

  const values = (env?.PREVIEW_OPTION_VALUES ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    handle,
    optionName: env?.PREVIEW_OPTION_NAME?.trim() || PRESENTATION_OPTION_NAME,
    optionValues: presentationCopy.map(
      (product, index) => values[index] ?? product.optionValue,
    ),
  };
}

/** A marketing presentation joined to its live Shopify variant, if one exists. */
export type Presentation = Product & {
  variant: StorefrontVariant | null;
};

/**
 * Stock state derived from Shopify inventory, ready to render.
 * `quantity` is null when the inventory scope isn't granted.
 */
export type StockState =
  | {kind: 'unavailable'}
  | {kind: 'out-of-stock'}
  | {kind: 'low'; quantity: number}
  | {kind: 'in-stock'};

export function getStockState(variant: StorefrontVariant | null): StockState {
  if (!variant) return {kind: 'unavailable'};
  if (!variant.availableForSale) return {kind: 'out-of-stock'};

  const {quantityAvailable} = variant;
  // `quantityAvailable` can be 0 while `availableForSale` is true when the
  // variant is set to "continue selling when out of stock" (backorder), so we
  // trust availableForSale for purchasability and use the number only for tone.
  if (quantityAvailable !== null && quantityAvailable > 0) {
    if (quantityAvailable <= LOW_STOCK_THRESHOLD) {
      return {kind: 'low', quantity: quantityAvailable};
    }
  }

  return {kind: 'in-stock'};
}

/**
 * Matches a Shopify variant to a marketing presentation. Prefers the explicit
 * `Presentación` option value and falls back to the variant title, so a store
 * that named the option differently still lines up.
 */
function findVariant(
  variants: StorefrontVariant[],
  optionName: string,
  optionValue: string,
): StorefrontVariant | null {
  const wanted = optionValue.trim().toLowerCase();
  const wantedOption = optionName.trim().toLowerCase();

  const byOption = variants.find((variant) =>
    variant.selectedOptions.some(
      (option) =>
        option.name.trim().toLowerCase() === wantedOption &&
        option.value.trim().toLowerCase() === wanted,
    ),
  );
  if (byOption) return byOption;

  return (
    variants.find(
      (variant) => variant.title.trim().toLowerCase() === wanted,
    ) ?? null
  );
}

/**
 * Loads the two presentations with live price and stock attached.
 *
 * Cached short: inventory is the most time-sensitive thing on the page, and a
 * long cache would keep selling a variant that sold out minutes ago.
 */
export async function loadPresentations(
  storefront: Storefront,
  env?: PreviewEnv,
): Promise<Presentation[]> {
  const target = resolveTarget(env);

  const data = await storefront
    .query<BiothreeProductQueryResponse>(BIOTHREE_PRODUCT_QUERY, {
      variables: {handle: target.handle},
      cache: storefront.CacheShort(),
    })
    .catch((error: Error) => {
      // Storefront not linked yet, or the product hasn't been created. Log it,
      // but let the marketing page render with Instagram CTAs.
      console.error('Biothree product query failed:', error);
      return null;
    });

  const variants = data?.product?.variants?.nodes ?? [];

  return presentationCopy.map((product, index) => ({
    ...product,
    variant: findVariant(
      variants,
      target.optionName,
      target.optionValues[index] ?? product.optionValue,
    ),
  }));
}
