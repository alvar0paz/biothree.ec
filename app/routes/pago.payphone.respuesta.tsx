// Where PayPhone sends the customer after the hosted payment form:
// /pago/payphone/respuesta?id=<transactionId>&clientTransactionId=<ours>.
//
// The loader confirms the transaction with PayPhone (mandatory within 5
// minutes, or PayPhone reverses it) and marks the order paid when the
// amount matches. It is deliberately a GET with idempotent side effects:
// that is how PayPhone redirects, and reloading the page must be harmless.

import {useEffect} from 'react';
import {Link, useLoaderData, useRevalidator} from 'react-router';
import type {Route} from './+types/pago.payphone.respuesta';
import {buttonClasses} from '~/components/marketing/Button';
import {
  BackToStoreLink,
  PaymentStatus,
  RetryPaymentButton,
} from '~/components/checkout/PaymentStatus';
import {shipping} from '~/data/shipping';
import {orderIdFromClientTransactionId} from '~/lib/payphone';
import {confirmPayphonePayment, getFlowEnv, type SettleResult} from '~/lib/payphone-flow';

export const meta: Route.MetaFunction = () => [
  {title: 'Resultado del pago | Biothree Ecuador'},
  {name: 'robots', content: 'noindex'},
];

type ResponseResult = SettleResult | {status: 'error'};

export async function loader({request, context}: Route.LoaderArgs) {
  const flowEnv = getFlowEnv(context.env);
  if (!flowEnv) throw new Response('Pagos no disponibles', {status: 503});

  const url = new URL(request.url);
  const transactionId = url.searchParams.get('id');
  const clientTransactionId = url.searchParams.get('clientTransactionId')?.trim() ?? '';
  const orderLegacyId = clientTransactionId
    ? orderIdFromClientTransactionId(clientTransactionId)
    : null;
  // When the hosted form could not even be shown (e.g. the response URL's
  // domain isn't authorised in PayPhone Developer) PayPhone comes back with
  // no `id` and its reason in `msg`. Worth showing: it is the only clue.
  const payphoneMessage = url.searchParams.get('msg')?.trim().slice(0, 300) || null;

  let result: ResponseResult;
  if (!clientTransactionId) {
    result = {status: 'skipped', order: null, reason: 'sale-not-found'};
  } else {
    try {
      result = await confirmPayphonePayment({transactionId, clientTransactionId}, flowEnv);
    } catch (error) {
      console.error(`PayPhone confirm failed for ${clientTransactionId}:`, error);
      result = {status: 'error'};
    }
  }

  if (result.status === 'skipped' && result.reason !== 'already-paid') {
    console.warn('PayPhone response not settled:', {
      clientTransactionId,
      transactionId,
      payphoneMessage,
      ...result,
    });
  }
  return {result, orderLegacyId, payphoneMessage};
}

export default function PayphoneResponsePage() {
  const {result, orderLegacyId, payphoneMessage} = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();

  // A failed confirmation call is worth one automatic retry: the 5-minute
  // confirmation window is short and the customer may not read the page.
  useEffect(() => {
    if (result.status !== 'error') return;
    const timer = setTimeout(() => {
      if (revalidator.state === 'idle') void revalidator.revalidate();
    }, 4000);
    return () => clearTimeout(timer);
  }, [result.status, revalidator]);

  if (result.status === 'paid' || (result.status === 'skipped' && result.reason === 'already-paid')) {
    return (
      <PaymentStatus
        tone="success"
        eyebrow={`Pedido ${result.order}`}
        title="¡Pago confirmado!"
        actions={
          <>
            <BackToStoreLink>Volver al inicio</BackToStoreLink>
            <Link to="/productos" className={buttonClasses({variant: 'soft'})}>
              Seguir viendo Biothree
            </Link>
          </>
        }
      >
        <p className="bt-p text-muted">
          Recibimos tu pago y tu pedido ya está en preparación. Te enviamos la
          confirmación por correo
          {result.status === 'paid' && result.authorizationCode
            ? ` (autorización PayPhone ${result.authorizationCode})`
            : ''}
          .
        </p>
        <p className="bt-p text-muted">{shipping.cutoff}</p>
        <p className="bt-p text-muted">{shipping.tracking}</p>
      </PaymentStatus>
    );
  }

  if (result.status === 'error') {
    return (
      <PaymentStatus
        tone="warning"
        title="Estamos verificando tu pago"
        actions={
          <>
            <button
              type="button"
              className={buttonClasses()}
              onClick={() => void revalidator.revalidate()}
              disabled={revalidator.state !== 'idle'}
              aria-busy={revalidator.state !== 'idle'}
            >
              {revalidator.state !== 'idle' ? 'Verificando…' : 'Verificar de nuevo'}
            </button>
          </>
        }
      >
        <p className="bt-p text-muted">
          PayPhone no respondió a tiempo. No cierres esta página: volvemos a
          verificar en unos segundos y, si tu pago fue aprobado, lo
          confirmamos aquí mismo.
        </p>
      </PaymentStatus>
    );
  }

  const reason = result.reason;
  if (reason === 'not-approved' || reason === 'sale-not-found') {
    return (
      <PaymentStatus
        tone="error"
        title={reason === 'not-approved' ? 'El pago no fue aprobado' : 'No encontramos tu pago'}
        actions={
          <>
            {orderLegacyId && <RetryPaymentButton orderLegacyId={orderLegacyId} />}
            <BackToStoreLink />
          </>
        }
      >
        <p className="bt-p text-muted">
          {reason === 'not-approved'
            ? 'Tu banco o PayPhone rechazó la transacción y no se realizó ningún cobro. Puedes intentarlo con otra tarjeta.'
            : 'PayPhone no registró ningún pago para este pedido. Si crees que sí pagaste, escríbenos con tu número de pedido.'}
        </p>
        {payphoneMessage && (
          <p className="rounded-control border border-line bg-cream px-4 py-3 bt-note text-ink">
            Mensaje de PayPhone: «{payphoneMessage}»
          </p>
        )}
        {orderLegacyId && (
          <p className="bt-note text-muted">
            Tu pedido sigue reservado mientras tanto.
          </p>
        )}
      </PaymentStatus>
    );
  }

  // Approved by PayPhone but something about the order doesn't line up
  // (amount edited, unknown id...). Never claim it is fine; a human looks.
  return (
    <PaymentStatus
      tone="warning"
      eyebrow={result.order ? `Pedido ${result.order}` : undefined}
      title="Recibimos tu pago y lo estamos revisando"
      actions={<BackToStoreLink />}
    >
      <p className="bt-p text-muted">
        PayPhone aprobó la transacción, pero necesitamos revisarla a mano
        antes de confirmar el pedido. Te escribimos al correo de tu pedido en
        cuanto esté listo; no hace falta que vuelvas a pagar.
      </p>
    </PaymentStatus>
  );
}
