import type {ReactNode} from 'react';

type RevealProps = {children: ReactNode; className?: string; delay?: number};

// Reading sections remain visible from the server render onward.
export function Reveal({children, className}: RevealProps) {
  return <div className={className}>{children}</div>;
}
