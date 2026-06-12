import {ProductCard} from './ProductCard';
import {Reveal} from './Reveal';
import {products} from '~/data/products';

// Biothree is one product in two presentations — show exactly two cards.
export function ProductGrid() {
  return (
    <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
      {products.map((product, i) => (
        <Reveal key={product.id} delay={i * 0.08} className="h-full">
          <ProductCard product={product} />
        </Reveal>
      ))}
    </div>
  );
}
