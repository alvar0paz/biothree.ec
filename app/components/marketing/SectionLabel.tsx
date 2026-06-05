import type {ReactNode} from 'react';

export function SectionLabel({children}: {children: ReactNode}) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-purple">
      <span className="h-1.5 w-1.5 rounded-full bg-purple" aria-hidden="true" />
      {children}
    </span>
  );
}
