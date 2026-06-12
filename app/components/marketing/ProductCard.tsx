import {Button} from './Button';
import {productPreview} from '~/data/copy';
import type {Product} from '~/data/products';

type ProductCardProps = {
  product: Product;
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
export function ProductCard({product}: ProductCardProps) {
  return (
    <div className="bt-card-hover flex h-full flex-col rounded-card border border-line bg-surface/70 p-6">
      <div className="bt-stage relative mb-5 flex h-[190px] items-center justify-center rounded-[18px]">
        <span className="absolute left-4 top-4 inline-flex items-baseline gap-1.5 rounded-full bg-surface/90 px-3 py-1.5">
          <span className="bt-eyebrow font-mono text-[0.6rem] text-muted">
            Presentación
          </span>
          <span className="bt-eyebrow font-mono text-[0.65rem] font-semibold text-purple">
            {product.tagline}
          </span>
        </span>
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="h-32 w-32 object-contain drop-shadow-[0_12px_20px_rgba(36,11,133,0.14)]"
        />
      </div>

      <h3 className="bt-h3 mb-2 text-ink">{product.name}</h3>
      <p className="bt-p mb-5 text-muted">{product.description}</p>

      <dl className="mb-6 flex flex-col">
        <SpecRow label="Formato" value={product.format} />
        <SpecRow label="Uso sugerido" value={product.usage} />
        <SpecRow label="Ideal para" value={product.idealFor} />
      </dl>

      {/* Bottom-aligned so both cards' CTAs line up regardless of copy length. */}
      <div className="mt-auto flex flex-col gap-2.5">
        <Button href={product.ctaUrl} variant="soft" className="w-full">
          {productPreview.cta}
        </Button>
        <p className="bt-note text-center text-muted">Disponible por Instagram</p>
      </div>
    </div>
  );
}
