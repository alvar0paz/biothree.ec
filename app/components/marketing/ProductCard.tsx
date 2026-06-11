import {Button} from './Button';
import {productPreview} from '~/data/copy';
import type {Product} from '~/data/products';

type ProductCardProps = {
  product: Product;
};

function CheckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-purple"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// Both presentations share one image treatment: same cream panel, same asset
// size, same label position — so the two cards read as one product.
export function ProductCard({product}: ProductCardProps) {
  return (
    <div className="flex h-full flex-col rounded-card border border-line bg-surface/70 p-6 transition-shadow hover:shadow-[0_16px_50px_-24px_rgba(36,11,133,0.28)]">
      <div className="relative mb-5 flex h-[180px] items-center justify-center rounded-[18px] bg-cream">
        <span className="bt-eyebrow absolute left-4 top-4 rounded-full bg-surface/80 px-2.5 py-1 font-mono text-[0.65rem] text-purple">
          {product.tagline}
        </span>
        <img
          src={product.image}
          alt={product.name}
          className="h-32 w-32 object-contain"
        />
      </div>

      <h3 className="bt-h3 mb-2 text-ink">{product.name}</h3>
      <p className="bt-p mb-4 text-muted">{product.description}</p>

      <ul className="mb-6 flex flex-col gap-2">
        {product.bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2 text-sm text-ink">
            <CheckIcon />
            {bullet}
          </li>
        ))}
      </ul>

      {/* Bottom-aligned so both cards' CTAs line up regardless of copy length. */}
      <Button
        href={product.ctaUrl}
        variant="soft"
        className="mt-auto w-full"
      >
        {productPreview.cta}
      </Button>
    </div>
  );
}
