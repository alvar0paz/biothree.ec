import {useState} from 'react';
import {Link, NavLink} from 'react-router';
import {AnimatePresence, motion, useReducedMotion} from 'framer-motion';
import {Button} from '~/components/marketing/Button';
import {NAV, INSTAGRAM_URL} from '~/data/copy';
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
  // Header renders outside PageLayout's <MotionConfig>, so reduced motion has
  // to be honored manually for the mobile menu animation.
  const reduceMotion = useReducedMotion();

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-line bg-background/85 backdrop-blur-md">
      <div className="bt-container grid h-16 grid-cols-[auto_1fr_auto] items-center">
        {/* Logo + grouped nav (left) */}
        <div className="flex items-center">
          <Link
            to="/"
            prefetch="intent"
            className="flex items-center"
            onClick={() => setOpen(false)}
          >
            <img src={biothreeLogo} alt="Biothree" className="h-[30px] w-auto" />
          </Link>

          <nav className="ml-12 hidden items-center gap-8 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                prefetch="intent"
                className={({isActive}) =>
                  `bt-nav-link text-[0.95rem] font-medium tracking-[-0.015em] transition-colors ${
                    isActive ? 'bt-nav-link-active' : ''
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Spacer column keeps grid balanced */}
        <span aria-hidden="true" />

        {/* Actions (right) */}
        <div className="flex items-center justify-end">
          <div className="hidden md:block">
            <Button href={INSTAGRAM_URL} variant="primary">
              Comprar
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-ink/5 md:hidden"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      {/* Mobile menu — quick fade/slide; static toggle under reduced motion. */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.nav
            id="mobile-menu"
            className="overflow-hidden border-t border-line bg-background/95 shadow-[0_18px_30px_-22px_rgba(17,17,17,0.25)] backdrop-blur-md md:hidden"
            initial={reduceMotion ? false : {opacity: 0, y: -6}}
            animate={{opacity: 1, y: 0}}
            exit={reduceMotion ? {opacity: 1} : {opacity: 0, y: -6}}
            transition={{duration: 0.18, ease: 'easeOut'}}
          >
            <div className="bt-container flex flex-col gap-1 py-4">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  prefetch="intent"
                  onClick={() => setOpen(false)}
                  className="bt-nav-link rounded-xl px-3 py-3 text-base font-medium hover:bg-ink/5"
                >
                  {item.label}
                </Link>
              ))}
              <Button
                href={INSTAGRAM_URL}
                variant="primary"
                size="lg"
                className="mt-2 w-full"
              >
                Comprar
              </Button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
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
