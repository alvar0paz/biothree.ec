import {NavLink} from 'react-router';
import type {HeaderQuery} from 'storefrontapi.generated';
import biothreeLogo from '~/assets/biothree1.png';

interface HeaderProps {
  header: HeaderQuery;
}

export function Header({header}: HeaderProps) {
  return (
    <header className="header">
      <NavLink prefetch="intent" to="/" className="header-logo" end>
        <img src={biothreeLogo} alt="Bio-Three" className="header-logo-img" />
      </NavLink>
      <nav className="header-nav">
        <NavLink prefetch="intent" to="/acerca-de" className="header-link">
          ACERCA DE
        </NavLink>
        <NavLink prefetch="intent" to="/test" className="header-cta">
          TEST DE SALUD INTESTINAL
        </NavLink>
      </nav>
    </header>
  );
}

// Keep HeaderMenu export for compatibility but simplified
export function HeaderMenu() {
  return null;
}
