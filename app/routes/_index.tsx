import {useState, useCallback, useEffect} from 'react';
import {Link} from 'react-router';
import type {Route} from './+types/_index';

// ============================================================================
// COPY CONSTANTS (Spanish)
// ============================================================================

const COPY = {
  testCta: 'TEST SALUD INTESTINAL',
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
// HEADLINE COMPONENT
// ============================================================================

const CYCLING_WORDS = ['Cepas', 'Pasos'];

function Headline() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % CYCLING_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="landing-headline">
      <span className="landing-headline-small">{COPY.headline.small}</span>
      <span className="landing-headline-large cycling-word" key={wordIndex}>
        {CYCLING_WORDS[wordIndex]}
      </span>
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
// MAIN GRID COMPONENT
// ============================================================================

function MainGrid() {
  return (
    <div className="landing-main">
      <div className="landing-grid">
        <Headline />
        <div className="landing-hero-placeholder" aria-hidden="true" />
        <StepCards />
      </div>
    </div>
  );
}

// ============================================================================
// HOMEPAGE COMPONENT
// ============================================================================

// ============================================================================
// HOMEPAGE COMPONENT
// ============================================================================

export default function Homepage() {
  const [modalType, setModalType] = useState<ModalType>(null);

  const closeModal = useCallback(() => setModalType(null), []);

  return (
    <div className="landing-content">
      <MainGrid />
      <Modal type={modalType} onClose={closeModal} />
    </div>
  );
}
