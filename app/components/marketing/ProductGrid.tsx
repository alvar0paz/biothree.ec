import {ProductCard} from './ProductCard';
import type {Presentation} from '~/lib/biothree';

export function ProductGrid({presentations}: {presentations: Presentation[]}) {
  return (
    <div className="bt-product-grid">
      {presentations.map((presentation) => (
        <ProductCard key={presentation.id} presentation={presentation} />
      ))}
    </div>
  );
}
