import {
  createContext,
  type ReactNode,
  useContext,
  useCallback,
  useId,
  useRef,
  useEffect,
  useState,
} from 'react';

type AsideType = 'search' | 'cart' | 'mobile' | 'closed';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
};

/**
 * A side bar component with Overlay
 * @example
 * ```jsx
 * <Aside type="search" heading="SEARCH">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 */
export function Aside({
  children,
  heading,
  type,
}: {
  children?: React.ReactNode;
  type: AsideType;
  heading: React.ReactNode;
}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;

  const headingId = useId();
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!expanded || !panel.current) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const element = panel.current;
    const focusable = () =>
      Array.from(
        element.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), input:not(:disabled):not([type="hidden"]), select, textarea, summary, [tabindex="0"]',
        ),
      ).filter((item) => item.getClientRects().length > 0);
    focusable()[0]?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key !== 'Tab') return;
      const items = focusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first) {
        event.preventDefault();
        element.focus();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !element.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !element.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      document.documentElement.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [close, expanded]);

  return (
    <div
      aria-modal={expanded}
      aria-hidden={!expanded}
      aria-labelledby={headingId}
      className={`overlay ${expanded ? 'expanded' : ''}`}
      role="dialog"
    >
      <button
        tabIndex={-1}
        className="close-outside"
        onClick={close}
        aria-label="Cerrar"
      />
      <aside ref={panel} tabIndex={-1} className="biothree">
        <header>
          <h2 id={headingId} className="bt-h3 text-ink">
            {heading}
          </h2>
          <button className="close reset" onClick={close} aria-label="Cerrar">
            &times;
          </button>
        </header>
        <div className="bt-aside-body">{children}</div>
      </aside>
    </div>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');
  const close = useCallback(() => setType('closed'), []);

  return (
    <AsideContext.Provider
      value={{
        type,
        open: setType,
        close,
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}
