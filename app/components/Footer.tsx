import {Link} from 'react-router';
import {footer} from '~/data/copy';
import biothreeLogo from '~/assets/biothree1.png';

function FooterLink({href, label}: {href: string; label: string}) {
  const isInternal = href.startsWith('/');
  const className = 'bt-footer-link text-sm';
  return isInternal ? (
    <Link to={href} prefetch="intent" className={className}>
      {label}
    </Link>
  ) : (
    <a
      href={href}
      className={className}
      {...(href.startsWith('http') ? {target: '_blank', rel: 'noopener noreferrer'} : {})}
    >
      {label}
    </a>
  );
}

/**
 * Two rows on the warm band: brand + one line of links, then the legal
 * text in small type. Nothing spreads across three columns any more.
 */
export function Footer() {
  return (
    <footer className="bt-band mt-auto">
      <div className="bt-container py-10 md:py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-12">
          <div className="flex flex-col gap-3">
            <Link to="/" prefetch="intent" className="inline-flex self-start" aria-label="Biothree, inicio">
              <img src={biothreeLogo} alt="" className="h-6 w-auto" />
            </Link>
            <p className="bt-note max-w-[34ch] text-muted">{footer.tagline}</p>
          </div>
          <nav aria-label="Pie de página">
            <ul className="grid list-none grid-cols-2 gap-x-10 p-0 sm:flex sm:flex-wrap sm:gap-x-7">
              {footer.links.map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href} label={link.label} />
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-hairline pt-5 text-[0.8125rem] leading-relaxed text-muted md:mt-10">
          <p className="max-w-[76ch]">{footer.disclaimer}</p>
          <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-x-6">
            <p>
              Importado y distribuido por{' '}
              <span className="font-medium text-ink/80">{footer.importer}</span>
              {' · Ecuador'}
            </p>
            <p>{footer.copyright}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
