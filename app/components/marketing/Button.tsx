import {Link} from 'react-router';
import type {ReactNode} from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium ' +
  'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-purple/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:opacity-90 hover:scale-[1.02]',
  secondary:
    'bg-transparent text-ink border border-ink/80 hover:bg-ink hover:text-white',
  ghost: 'bg-transparent text-ink hover:bg-ink/5',
};

const sizes: Record<Size, string> = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
};

type ButtonProps = CommonProps & {
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  href,
  onClick,
  type = 'button',
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    const isInternal = href.startsWith('/');
    if (isInternal) {
      return (
        <Link to={href} prefetch="intent" className={classes}>
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        className={classes}
        {...(href.startsWith('http')
          ? {target: '_blank', rel: 'noopener noreferrer'}
          : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
