import {Money} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {Button, buttonClasses} from './Button';
import {StockBadge} from './StockBadge';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {productPreview} from '~/data/copy';
import {shipping} from '~/data/shipping';
import {getStockState, type Presentation} from '~/lib/biothree';

function SpecRow({label, value}: {label: string; value: string}) {
  return (
    <div className="bt-spec-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function ProductCard({presentation}: {presentation: Presentation}) {
  const {variant} = presentation;
  const stock = getStockState(variant);
  const {open} = useAside();
  return (
    <article
      className="bt-product-card"
      aria-labelledby={`product-${presentation.id}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pt-5">
        <span className="bt-eyebrow font-mono text-muted">
          Presentación · {presentation.tagline}
        </span>
        <StockBadge stock={stock} />
      </div>
      <div className="bt-product-stage">
        <img
          src={presentation.image}
          alt={presentation.name}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="bt-product-copy">
        <h3
          id={`product-${presentation.id}`}
          className="bt-product-title text-ink"
        >
          {presentation.name}
        </h3>
        <p className="bt-p max-w-[50ch] text-muted">
          {presentation.description}
        </p>
      </div>
      <div className="bt-product-purchase">
        <div className="bt-product-price-slot flex flex-wrap items-baseline gap-3">
          {variant && (
            <>
              <span className="bt-price text-ink">
                <Money data={variant.price} />
              </span>
              {variant.compareAtPrice &&
                Number(variant.compareAtPrice.amount) >
                  Number(variant.price.amount) && (
                  <s className="text-sm text-muted">
                    <Money data={variant.compareAtPrice} />
                  </s>
                )}
            </>
          )}
        </div>
        {variant ? (
          stock.kind === 'out-of-stock' ? (
            <>
              <button
                type="button"
                disabled
                className={buttonClasses({
                  variant: 'soft',
                  className: 'w-full',
                })}
              >
                Agotado
              </button>
              <p className="bt-note text-muted">
                Escríbenos por Instagram para avisarte cuando vuelva
              </p>
            </>
          ) : (
            <AddToCartButton
              lines={[{merchandiseId: variant.id, quantity: 1}]}
              onSuccess={() => open('cart')}
              className={buttonClasses({className: 'w-full'})}
              analytics={{
                products: [
                  {
                    productGid: variant.id,
                    variantGid: variant.id,
                    name: presentation.name,
                    variantName: presentation.tagline,
                    price: variant.price.amount,
                    quantity: 1,
                  },
                ],
              }}
            >
              Agregar al carrito
            </AddToCartButton>
          )
        ) : (
          <>
            <Button
              href={presentation.ctaUrl}
              variant="soft"
              className="w-full"
            >
              {productPreview.cta}
            </Button>
            <p className="bt-note text-muted">Disponible por Instagram</p>
          </>
        )}
      </div>
      <div className="bt-product-specs">
        <dl>
          <SpecRow label="Formato" value={presentation.format} />
          <SpecRow label="Uso sugerido" value={presentation.usage} />
          <SpecRow label="Ideal para" value={presentation.idealFor} />
        </dl>
        <Link
          to="/productos#uso-sugerido"
          className="inline-flex min-h-11 items-center text-sm text-purple underline underline-offset-4"
        >
          Ver uso sugerido e indicaciones
        </Link>
        <div className="mt-4 border-t border-line pt-4">
          <p className="bt-note text-muted">Envíos a todo el Ecuador</p>
          <Link
            to="/productos#envios"
            className="bt-note inline-flex min-h-11 items-center text-muted underline underline-offset-4"
          >
            {shipping.promotion}
          </Link>
        </div>
      </div>
    </article>
  );
}
