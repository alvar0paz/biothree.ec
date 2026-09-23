import type {ReactNode} from 'react';

/**
 * Editorial running head: an optional folio number ("01") and a small
 * tracked label. It is the marketing pages' one recurring detail, so it
 * carries no rule or icon of its own.
 */
export function SectionLabel({
  index,
  children,
}: {
  index?: string;
  children: ReactNode;
}) {
  return (
    <span className="bt-index">
      {index && <span className="bt-index-number">{index}</span>}
      <span className="bt-index-label">{children}</span>
    </span>
  );
}
