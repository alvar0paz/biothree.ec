import {Link} from 'react-router';
import type {ReactNode} from 'react';

type Variant = 'primary' | 'secondary' | 'soft';
type Size = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium ' +
  'tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-purple/50 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none';

// Color/background live in unlayered .bt-btn-* classes (tailwind.css) so they
// survive the Shopify reset's global `a` styles.
const variants: Record<Variant, string> = {
  primary: 'bt-btn-primary hover:opacity-90',
  secondary: 'bt-btn-secondary',
  soft: 'bt-btn-soft',
};

const sizes: Record<Size, string> = {
  // Compact, confident: 44px min height, 20px horizontal padding.
  md: 'min-h-[44px] px-5 text-[0.95rem]',
  // Slightly larger for hero moments only.
  lg: 'min-h-[50px] px-6 text-base',
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
