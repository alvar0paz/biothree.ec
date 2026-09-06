import {Money} from '@shopify/hydrogen';
import {Button, buttonClasses} from './Button';
import {StockBadge} from './StockBadge';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {productPreview} from '~/data/copy';
import {getStockState, type Presentation} from '~/lib/biothree';

type ProductCardProps = {
  presentation: Presentation;
};

function SpecRow({label, value}: {label: string; value: string}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line/70 py-2 last:border-0">
      <dt className="bt-eyebrow shrink-0 font-mono text-[0.65rem] text-muted">
        {label}
      </dt>
      <dd className="text-right text-sm leading-snug text-ink">{value}</dd>
    </div>
  );
}

// Both presentations share one treatment: same purple stage, same asset size,
// same label and spec rows — so the two cards read as one product.
export function ProductCard({presentation}: ProductCardProps) {
  const {variant} = presentation;
  const stock = getStockState(variant);
  const {open} = useAside();

  return (
    <div className="bt-card-hover flex h-full flex-col rounded-card border border-line bg-surface/70 p-6">
      <div className="bt-stage relative mb-5 flex h-[190px] items-center justify-center rounded-[18px]">
        <span className="absolute left-4 top-4 inline-flex items-baseline gap-1.5 rounded-full bg-surface/90 px-3 py-1.5">
          <span className="bt-eyebrow font-mono text-[0.6rem] text-muted">
            Presentación
          </span>
          <span className="bt-eyebrow font-mono text-[0.65rem] font-semibold text-purple">
            {presentation.tagline}
          </span>
        </span>
        <img
          src={presentation.image}
          alt={presentation.name}
          loading="lazy"
          decoding="async"
          className="h-32 w-32 object-contain drop-shadow-[0_12px_20px_rgba(36,11,133,0.14)]"
        />
      </div>

      <h3 className="bt-h3 mb-2 text-ink">{presentation.name}</h3>
      <p className="bt-p mb-4 text-muted">{presentation.description}</p>

      {/* Price row only renders once the variant exists in Shopify — an empty
          admin shows the card exactly as it looked before commerce landed. */}
      {variant && (
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <span className="flex items-baseline gap-2">
            <span className="bt-h3 text-ink">
              <Money data={variant.price} />
            </span>
            {variant.compareAtPrice &&
              Number(variant.compareAtPrice.amount) >
                Number(variant.price.amount) && (
                <s className="text-sm text-muted">
                  <Money data={variant.compareAtPrice} />
                </s>
              )}
          </span>
          <StockBadge stock={stock} />
        </div>
      )}

      <dl className="mb-6 flex flex-col">
        <SpecRow label="Formato" value={presentation.format} />
        <SpecRow label="Uso sugerido" value={presentation.usage} />
        <SpecRow label="Ideal para" value={presentation.idealFor} />
      </dl>

      {/* Bottom-aligned so both cards' CTAs line up regardless of copy length. */}
      <div className="mt-auto flex flex-col gap-2.5">
        {variant ? (
          stock.kind === 'out-of-stock' ? (
            <>
              <button
                type="button"
                disabled
                className={buttonClasses({variant: 'soft', className: 'w-full'})}
              >
                Agotado
              </button>
              <p className="bt-note text-center text-muted">
                Escríbenos por Instagram para avisarte cuando vuelva
              </p>
            </>
          ) : (
            <>
              <AddToCartButton
                lines={[{merchandiseId: variant.id, quantity: 1}]}
                onClick={() => open('cart')}
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
              <p className="bt-note text-center text-muted">
                Envíos a todo el Ecuador
              </p>
            </>
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
            <p className="bt-note text-center text-muted">
              Disponible por Instagram
            </p>
          </>
        )}
      </div>
    </div>
  );
}
