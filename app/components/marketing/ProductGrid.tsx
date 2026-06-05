import {ProductCard} from './ProductCard';
import {Reveal} from './Reveal';
import {products} from '~/data/products';

type ProductGridProps = {
  variant?: 'buy' | 'preview';
};

export function ProductGrid({variant = 'preview'}: ProductGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product, i) => (
        <Reveal key={product.id} delay={i * 0.08}>
          <ProductCard product={product} variant={variant} />
        </Reveal>
      ))}
    </div>
  );
}
