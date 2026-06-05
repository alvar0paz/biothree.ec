import {Button} from './Button';
import type {Product} from '~/data/products';

type ProductCardProps = {
  product: Product;
  /** Show price + "Comprar" (productos page) vs. "Ver producto" preview (home). */
  variant?: 'buy' | 'preview';
};

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
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

export function ProductCard({product, variant = 'preview'}: ProductCardProps) {
  return (
    <div className="flex h-full flex-col rounded-card border border-line bg-surface/70 p-6 transition-shadow hover:shadow-[0_16px_50px_-22px_rgba(36,11,133,0.3)]">
      <div className="mb-5 flex items-center justify-center rounded-[24px] bg-cream p-6">
        <img
          src={product.image}
          alt={product.name}
          className="h-36 w-36 object-contain sm:h-40 sm:w-40"
        />
      </div>

      <span className="font-mono text-xs uppercase tracking-[0.14em] text-purple">
        {product.shortName}
      </span>
      <h3 className="mt-1.5 font-tight text-2xl font-semibold text-ink">
        {product.name}
      </h3>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        {product.description}
      </p>

      <ul className="mt-5 flex flex-col gap-2">
        {product.bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2 text-sm text-ink">
            <CheckIcon />
            {bullet}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between gap-3 pt-2">
        {variant === 'buy' ? (
          <>
            <span className="font-tight text-xl font-semibold text-ink">
              {product.price}
            </span>
            <Button href={product.checkoutUrl} variant="primary">
              Comprar
            </Button>
          </>
        ) : (
          <Button href="/productos" variant="secondary" className="w-full">
            Ver producto
          </Button>
        )}
      </div>
    </div>
  );
}
