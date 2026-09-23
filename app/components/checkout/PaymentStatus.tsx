import {Form, Link} from 'react-router';
import {buttonClasses} from '~/components/marketing/Button';

type Tone = 'success' | 'warning' | 'error' | 'info';

const toneClasses: Record<Tone, string> = {
  success: 'bg-purple-soft text-purple-dark',
  warning: 'bg-cream text-ink',
  error: 'bg-red-50 text-red-800',
  info: 'bg-surface text-ink border border-line',
};

function ToneIcon({tone}: {tone: Tone}) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {tone === 'success' ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 12.5 2.5 2.5 4.5-5" />
        </>
      ) : tone === 'error' ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9l6 6M15 9l-6 6" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4M12 16h.01" />
        </>
      )}
    </svg>
  );
}

/**
 * Shared layout for the pages a customer lands on around a PayPhone
 * payment: confirmation, cancellation, retry.
 */
export function PaymentStatus({
  tone,
  eyebrow,
  title,
  children,
  actions,
}: {
  tone: Tone;
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="biothree">
      <div className="bt-container-narrow bt-section">
        <div className="flex max-w-2xl flex-col items-start gap-6">
          <span
            className={`inline-flex h-14 w-14 items-center justify-center rounded-card ${toneClasses[tone]}`}
          >
            <ToneIcon tone={tone} />
          </span>
          <div className="flex flex-col gap-3">
            {eyebrow && (
              <p className="bt-eyebrow font-mono text-xs uppercase text-muted">{eyebrow}</p>
            )}
            <h1 className="bt-h2 text-ink">{title}</h1>
          </div>
          {children && <div className="flex flex-col gap-4">{children}</div>}
          {actions && <div className="flex flex-wrap gap-3 pt-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

/** "Pagar con PayPhone" for an existing pending order: POSTs to /pagar/:id. */
export function RetryPaymentButton({
  orderLegacyId,
  children = 'Intentar el pago de nuevo',
  busy = false,
}: {
  orderLegacyId: string;
  children?: React.ReactNode;
  busy?: boolean;
}) {
  return (
    <Form method="post" action={`/pagar/${orderLegacyId}`}>
      <button type="submit" className={buttonClasses()} disabled={busy} aria-busy={busy}>
        {busy ? 'Redirigiendo a PayPhone…' : children}
      </button>
    </Form>
  );
}

export function BackToStoreLink({children = 'Volver a la tienda'}: {children?: React.ReactNode}) {
  return (
    <Link to="/" className={buttonClasses({variant: 'secondary'})}>
      {children}
    </Link>
  );
}
