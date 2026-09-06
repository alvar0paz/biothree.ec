import {ProductCard} from './ProductCard';
import {Reveal} from './Reveal';
import type {Presentation} from '~/lib/biothree';

// Biothree is one product in two presentations — show exactly two cards.
// Presentations come from the route loader so each card carries live Shopify
// price and stock; see ~/lib/biothree.ts.
export function ProductGrid({
  presentations,
}: {
  presentations: Presentation[];
}) {
  return (
    <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
      {presentations.map((presentation, i) => (
        <Reveal key={presentation.id} delay={i * 0.08} className="h-full">
          <ProductCard presentation={presentation} />
        </Reveal>
      ))}
    </div>
  );
}
