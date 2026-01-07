import {NavLink} from 'react-router';
import type {HeaderQuery} from 'storefrontapi.generated';

interface HeaderProps {
  header: HeaderQuery;
}

export function Header({header}: HeaderProps) {
  const {shop} = header;
  return (
    <header className="header">
      <NavLink prefetch="intent" to="/" className="header-logo" end>
        <strong>{shop.name}</strong>
      </NavLink>
      <NavLink prefetch="intent" to="/acerca-de" className="header-link">
        Acerca de
      </NavLink>
    </header>
  );
}

// Keep HeaderMenu export for compatibility but simplified
export function HeaderMenu() {
  return null;
}
