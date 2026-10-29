import {pageMeta, SITE_URL} from '~/lib/seo';
import {redirect, useLoaderData} from 'react-router';
import {CommerceView} from '~/components/Measurement';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductImage} from '~/components/ProductImage';
import {PresentationImage} from '~/components/PresentationImage';
import {getProductPresentation} from '~/lib/product-presentation';
import {ProductForm} from '~/components/ProductForm';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

export const meta: Route.MetaFunction = ({data}) => {
  const product = data?.product;
  if (!product)
    return [
      {title: 'Producto no encontrado | Biothree Ecuador'},
      {name: 'robots', content: 'noindex'},
    ];
  const variant = product.selectedOrFirstAvailableVariant;
  const presentation = getProductPresentation(
    product.handle,
    variant?.selectedOptions ?? [],
  );
  const image = presentation?.image || variant?.image?.url;
  const description =
    presentation?.description || product.seo.description || product.description;
  const path = `/products/${product.handle}`;
  return [
    ...pageMeta({
      title: presentation
        ? `${presentation.name} | Biothree Ecuador`
        : product.seo.title || `${product.title} | Biothree Ecuador`,
      description,
      path,
      image,
    }),
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: presentation?.name || product.title,
        description,
        url: `${SITE_URL}${path}`,
        ...(image ? {image: [new URL(image, SITE_URL).href]} : {}),
        ...(variant
          ? {
              offers: {
                '@type': 'Offer',
                price: variant.price.amount,
                priceCurrency: variant.price.currencyCode,
                availability: variant.availableForSale
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
                url: `${SITE_URL}${path}?${new URLSearchParams(variant.selectedOptions.map(({name, value}) => [name, value])).toString()}`,
              },
            }
          : {}),
      },
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {
    product,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context, params}: Route.LoaderArgs) {
  // Put any API calls that is not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.

  return {};
}

export default function Product() {
  const {product} = useLoaderData<typeof loader>();

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {title, descriptionHtml} = product;
  const presentation = getProductPresentation(
    product.handle,
    selectedVariant.selectedOptions,
  );

  return (
    <div className="biothree">
      <div className="bt-container bt-section bt-product-detail">
        {presentation ? (
          <figure className="product-image">
            <PresentationImage
              handle={product.handle}
              selectedOptions={selectedVariant.selectedOptions}
              image={selectedVariant.image}
              size={720}
            />
            <figcaption className="bt-note mt-3 text-muted">
              Vista frontal del empaque
            </figcaption>
          </figure>
        ) : (
          <ProductImage image={selectedVariant?.image} />
        )}
        <div className="flex min-w-0 flex-col gap-6">
          <h1 className="bt-h2">{presentation?.name || title}</h1>
          {presentation && (
            <p className="bt-p text-muted">{presentation.description}</p>
          )}
          <ProductPrice
            price={selectedVariant?.price}
            compareAtPrice={selectedVariant?.compareAtPrice}
          />
          <ProductForm
            productOptions={productOptions}
            selectedVariant={selectedVariant}
          />
          <h2 className="bt-h3 border-t border-line pt-6">Descripción</h2>
          {presentation ? (
            <div className="bt-prose">
              <p>
                {presentation.format}. Consulta las indicaciones de uso y
                conservación de esta presentación.
              </p>
              <p>El contenido de la caja no indica una duración de uso.</p>
              <a href="/productos#uso-sugerido">
                Información de uso y orientación
              </a>
              <p>
                Revisa el envío, los impuestos y el total en el checkout antes
                de pagar.
              </p>
              <a href="/productos#envios">Consultar información de envío</a>
            </div>
          ) : (
            <div
              className="bt-prose"
              dangerouslySetInnerHTML={{__html: descriptionHtml}}
            />
          )}
        </div>
      </div>
      {selectedVariant && <CommerceView name="view_item" eventKey={selectedVariant.id} data={{currency: selectedVariant.price.currencyCode, value: Number(selectedVariant.price.amount), items: [{item_id: selectedVariant.id.split('/').pop()!, price: Number(selectedVariant.price.amount), quantity: 1}]}} />}
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;
