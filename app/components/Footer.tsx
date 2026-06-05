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

function TikTokIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
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
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <img src={biothreeLogo} alt="Biothree" className="h-7 w-auto self-start" />
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              {footer.tagline}
            </p>
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
              <a
                href="https://tiktok.com/@biothree.ec"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="transition-colors hover:text-purple"
              >
                <TikTokIcon />
              </a>
            </div>
          </div>

          {footer.columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink">
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
