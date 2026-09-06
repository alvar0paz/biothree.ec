import type {StockState} from '~/lib/biothree';

// Renders live Shopify inventory as a small pill. Deliberately quiet: stock is
// reassurance, not the loudest thing on the card. `unavailable` renders nothing
// so the card can fall back to its Instagram CTA without a dangling badge.
export function StockBadge({stock}: {stock: StockState}) {
  let dot: string;
  let text: string;
  let label: string;

  switch (stock.kind) {
    case 'unavailable':
      return null;
    case 'out-of-stock':
      dot = 'bg-ink/30';
      text = 'text-muted';
      label = 'Agotado';
      break;
    case 'low':
      dot = 'bg-amber-500';
      text = 'text-ink';
      label = `Quedan ${stock.quantity} ${
        stock.quantity === 1 ? 'unidad' : 'unidades'
      }`;
      break;
    case 'in-stock':
      dot = 'bg-emerald-500';
      text = 'text-muted';
      label = 'En stock';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[0.78rem] font-medium ${text}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`}
      />
      {label}
    </span>
  );
}
