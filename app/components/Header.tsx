import {useState} from 'react';
import {Link, NavLink} from 'react-router';
import {Button} from '~/components/marketing/Button';
import {NAV} from '~/data/copy';
import biothreeLogo from '~/assets/biothree1.png';

function MenuIcon({open}: {open: boolean}) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" />
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <Link
          to="/"
          prefetch="intent"
          className="flex items-center"
          onClick={() => setOpen(false)}
        >
          <img src={biothreeLogo} alt="Biothree" className="h-7 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              prefetch="intent"
              className={({isActive}) =>
                `text-sm font-medium transition-colors hover:text-purple ${
                  isActive ? 'text-purple' : 'text-ink'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button href="/productos" variant="primary">
            Comprar
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-ink/5 md:hidden"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <MenuIcon open={open} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="border-t border-line bg-background/95 px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                prefetch="intent"
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-base font-medium text-ink hover:bg-ink/5"
              >
                {item.label}
              </Link>
            ))}
            <Button
              href="/productos"
              variant="primary"
              size="lg"
              className="mt-2 w-full"
            >
              Comprar
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}

// Kept for compatibility with PageLayout's MobileMenuAside import.
// The marketing header provides its own mobile menu, so this renders nothing.
export function HeaderMenu(_props: {
  menu?: unknown;
  viewport?: string;
  primaryDomainUrl?: string;
  publicStoreDomain?: string;
}) {
  return null;
}
