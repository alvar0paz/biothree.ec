import {Link} from 'react-router';
import {footer, INSTAGRAM_URL} from '~/data/copy';
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
  const className = 'bt-footer-link text-sm transition-colors';
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
      <div className="bt-container pt-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <img
              src={biothreeLogo}
              alt="Biothree"
              className="max-h-[30px] w-auto self-start"
            />
            <p className="bt-p max-w-xs text-muted">{footer.tagline}</p>
            <div className="mt-1 flex items-center gap-3">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="bt-nav-link transition-colors"
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

        <div className="bt-legal mt-12 border-t border-line pb-12 pt-7 text-muted">
          <p>{footer.legalLine1.join(' · ')}</p>
          <p className="mt-2">
            Importado y distribuido por{' '}
            <span className="font-medium text-[#4f4f4f]">{footer.importer}</span>
            {' · '}
            {footer.legalLine2.join(' · ')}
          </p>
        </div>
      </div>
    </footer>
  );
}
