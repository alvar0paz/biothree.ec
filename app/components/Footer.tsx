import {Link} from 'react-router';
import {footer} from '~/data/copy';
import biothreeLogo from '~/assets/biothree1.png';

function InstagramIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FooterLink({href, label}: {href: string; label: string}) {
  const isInternal = href.startsWith('/');
  const className =
    'text-sm text-muted transition-colors hover:text-ink';
  return isInternal ? (
    <Link to={href} prefetch="intent" className={className}>
      {label}
    </Link>
  ) : (
    <a href={href} className={className}>
      {label}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-background">
      <div className="bt-container py-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <img
              src={biothreeLogo}
              alt="Biothree"
              className="max-h-[30px] w-auto self-start"
            />
            <p className="bt-p max-w-xs text-muted">{footer.tagline}</p>
            <div className="mt-1 flex items-center gap-3 text-ink">
              <a
                href="https://instagram.com/biothree.ec"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="transition-colors hover:text-purple"
              >
                <InstagramIcon />
              </a>
            </div>
          </div>

          {footer.columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <span className="bt-eyebrow font-mono text-xs text-ink">
                {column.title}
              </span>
              {column.links.map((link) => (
                <FooterLink key={link.label} href={link.href} label={link.label} />
              ))}
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-line pt-6">
          <p className="max-w-3xl text-xs leading-relaxed text-muted">
            {footer.disclaimer}
          </p>
          <p className="mt-4 text-xs text-muted">{footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
