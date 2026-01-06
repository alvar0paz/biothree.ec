import {useState, useCallback, useEffect} from 'react';
import {Link} from 'react-router';
import type {Route} from './+types/_index';

// ============================================================================
// COPY CONSTANTS (Spanish)
// ============================================================================

const COPY = {
  brand: 'BIO-THREE®',
  nav: {
    menu: 'Menú',
    discover: '+ Descubre más',
    testCta: 'TEST SALUD INTESTINAL',
  },
  headline: {
    small: 'Tres',
    large1: 'Cepas',
    large2: 'Pasos',
    text1: 'para sanar tu',
    emphasis: 'Salud Intestinal',
  },
  steps: [
    {
      label: 'PREPARAR',
      kanji: '間',
      cta: 'Inicia el hábito',
    },
    {
      label: 'TRANSFORMAR',
      kanji: '改革',
      cta: 'Restaura el equilibrio',
    },
    {
      label: 'MANTENER',
      kanji: '継続',
      cta: 'Sostén el avance',
    },
  ],
  ticker: 'TECNOLOGÍA JAPONESA REAL * CEPAS PATENTADAS ACTIVAS * RESISTENCIA',
  modals: {
    discover: {
      title: 'Descubre Bio-Three',
      description:
        'Bio-Three es un suplemento probiótico de tecnología japonesa diseñado para restaurar y mantener tu salud intestinal de manera natural.',
      bullets: [
        'Cepas probióticas patentadas de alta resistencia',
        'Tecnología japonesa con más de 50 años de investigación',
        'Resultados visibles en las primeras semanas de uso',
      ],
      linkText: 'Ver productos',
      linkHref: '/products',
    },
    howItWorks: {
      title: 'Cómo funciona',
      description:
        'Nuestro sistema de tres pasos está diseñado para preparar, transformar y mantener tu salud intestinal.',
      bullets: [
        'Paso 1: Prepara tu sistema digestivo para recibir los probióticos',
        'Paso 2: Transforma tu flora intestinal con cepas activas',
        'Paso 3: Mantén los resultados con un régimen continuo',
      ],
    },
    contact: {
      title: 'Contacto',
      description: 'Estamos aquí para ayudarte con cualquier pregunta.',
      whatsapp: '+593 99 123 4567',
      email: 'info@biothree.ec',
    },
  },
  drawer: {
    title: 'Menú',
    links: [
      {label: 'Productos', href: '/products'},
      {label: 'Cómo funciona', action: 'howItWorks'},
      {label: 'Contacto', action: 'contact'},
    ],
  },
} as const;

// ============================================================================
// META
// ============================================================================

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Bio-Three | Salud Intestinal'},
    {
      name: 'description',
      content:
        'Descubre Bio-Three, probióticos de tecnología japonesa para tu salud intestinal.',
    },
  ];
};

// ============================================================================
// LOADER (no CMS, static page)
// ============================================================================

export async function loader() {
  return {};
}

// ============================================================================
// ICONS
// ============================================================================

function HamburgerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2 4h12M2 8h12M2 12h12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ============================================================================
// MODAL COMPONENT
// ============================================================================

type ModalType = 'discover' | 'howItWorks' | 'contact' | null;

function Modal({
  type,
  onClose,
}: {
  type: ModalType;
  onClose: () => void;
}) {
  useEffect(() => {
    if (type) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [type]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (type) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [type, onClose]);

  if (!type) return null;

  const renderContent = () => {
    switch (type) {
      case 'discover':
        return (
          <>
            <p>{COPY.modals.discover.description}</p>
            <ul>
              {COPY.modals.discover.bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
            <Link
              to={COPY.modals.discover.linkHref}
              className="landing-modal-link"
            >
              {COPY.modals.discover.linkText} →
            </Link>
          </>
        );
      case 'howItWorks':
        return (
          <>
            <p>{COPY.modals.howItWorks.description}</p>
            <ul>
              {COPY.modals.howItWorks.bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          </>
        );
      case 'contact':
        return (
          <>
            <p>{COPY.modals.contact.description}</p>
            <p>
              <strong>WhatsApp:</strong>{' '}
              <a
                href={`https://wa.me/${COPY.modals.contact.whatsapp.replace(/\s/g, '')}`}
                className="landing-modal-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {COPY.modals.contact.whatsapp}
              </a>
            </p>
            <p>
              <strong>Email:</strong>{' '}
              <a
                href={`mailto:${COPY.modals.contact.email}`}
                className="landing-modal-link"
              >
                {COPY.modals.contact.email}
              </a>
            </p>
          </>
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'discover':
        return COPY.modals.discover.title;
      case 'howItWorks':
        return COPY.modals.howItWorks.title;
      case 'contact':
        return COPY.modals.contact.title;
      default:
        return '';
    }
  };

  return (
    <div
      className={`landing-modal-overlay ${type ? 'open' : ''}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="landing-modal"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <div className="landing-modal-header">
          <h2 id="modal-title" className="landing-modal-title">
            {getTitle()}
          </h2>
          <button
            className="landing-modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="landing-modal-content">{renderContent()}</div>
      </div>
    </div>
  );
}

// ============================================================================
// DRAWER COMPONENT
// ============================================================================

function Drawer({
  isOpen,
  onClose,
  onOpenModal,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenModal: (type: ModalType) => void;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleLinkClick = (
    link: (typeof COPY.drawer.links)[number],
    e: React.MouseEvent,
  ) => {
    if ('action' in link && link.action) {
      e.preventDefault();
      onClose();
      setTimeout(() => {
        onOpenModal(link.action as ModalType);
      }, 300);
    } else {
      onClose();
    }
  };

  return (
    <div
      className={`landing-drawer-overlay ${isOpen ? 'open' : ''}`}
      onClick={onClose}
    >
      <div
        className="landing-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div className="landing-drawer-header">
          <h2 id="drawer-title" className="landing-drawer-title">
            {COPY.drawer.title}
          </h2>
          <button
            className="landing-drawer-close"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <CloseIcon />
          </button>
        </div>
        <nav className="landing-drawer-nav">
          {COPY.drawer.links.map((link, i) => (
            <Link
              key={i}
              to={'href' in link ? link.href : '#'}
              className="landing-drawer-link"
              onClick={(e) => handleLinkClick(link, e)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

// ============================================================================
// TOP NAV COMPONENT
// ============================================================================

function TopNav({
  onOpenDrawer,
  onOpenModal,
}: {
  onOpenDrawer: () => void;
  onOpenModal: (type: ModalType) => void;
}) {
  return (
    <nav className="landing-nav" role="navigation" aria-label="Navegación principal">
      <div className="landing-brand">{COPY.brand}</div>

      <div className="landing-nav-center">
        <div className="landing-pill-group">
          <button
            className="landing-pill landing-pill--filled"
            onClick={onOpenDrawer}
            aria-label="Abrir menú de navegación"
          >
            <span className="landing-pill-icon">
              <HamburgerIcon />
            </span>
            {COPY.nav.menu}
          </button>
          <button
            className="landing-pill landing-pill--dark"
            onClick={() => onOpenModal('discover')}
          >
            {COPY.nav.discover}
          </button>
        </div>
      </div>

      <Link to="/test" className="landing-cta-btn">
        {COPY.nav.testCta}
      </Link>
    </nav>
  );
}

// ============================================================================
// HEADLINE COMPONENT
// ============================================================================

function Headline() {
  return (
    <div className="landing-headline">
      <span className="landing-headline-small">{COPY.headline.small}</span>
      <span className="landing-headline-large">{COPY.headline.large1}</span>
      <span className="landing-headline-large">{COPY.headline.large2}</span>
      <span className="landing-headline-text">
        {COPY.headline.text1}
        <br />
        <span className="landing-headline-emphasis">
          {COPY.headline.emphasis}
        </span>
      </span>
    </div>
  );
}

// ============================================================================
// STEP CARDS COMPONENT
// ============================================================================

function StepCards() {
  return (
    <div className="landing-steps">
      {COPY.steps.map((step, i) => (
        <div key={i} className="landing-step-card">
          <span className="landing-step-label">{step.label}</span>
          <span className="landing-step-kanji">{step.kanji}</span>
          <Link to="/test" className="landing-step-cta">
            {step.cta}
          </Link>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// BOTTOM TICKER COMPONENT
// ============================================================================

function BottomTicker() {
  return (
    <div className="landing-ticker">
      <span className="landing-ticker-text">{COPY.ticker}</span>
    </div>
  );
}

// ============================================================================
// MAIN GRID COMPONENT
// ============================================================================

function MainGrid() {
  return (
    <main className="landing-main">
      <div className="landing-grid">
        <Headline />
        <div className="landing-hero-placeholder" aria-hidden="true" />
        <StepCards />
      </div>
    </main>
  );
}

// ============================================================================
// HOMEPAGE COMPONENT
// ============================================================================

export default function Homepage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const openModal = useCallback((type: ModalType) => setModalType(type), []);
  const closeModal = useCallback(() => setModalType(null), []);

  return (
    <div className="landing-shell">
      <div className="landing-container">
        <TopNav onOpenDrawer={openDrawer} onOpenModal={openModal} />
        <MainGrid />
        <BottomTicker />
      </div>

      <Drawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        onOpenModal={openModal}
      />
      <Modal type={modalType} onClose={closeModal} />
    </div>
  );
}
