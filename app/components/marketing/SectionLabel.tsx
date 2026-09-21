import type {ReactNode} from 'react';

export function SectionLabel({children}: {children: ReactNode}) {
  return (
    <span className="bt-eyebrow inline-flex items-center gap-2 font-mono text-xs text-purple">
      <span className="h-px w-6 shrink-0 bg-purple" aria-hidden="true" />
      {children}
    </span>
  );
}
