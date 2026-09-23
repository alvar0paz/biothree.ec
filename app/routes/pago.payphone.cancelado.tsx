// Where PayPhone sends the customer when they close the hosted payment form
// (the X icon). Nothing was charged; the order stays pending and payable.
// `pedido` is added to the cancellation URL by us so the retry button knows
// which order to pay.

import {useLoaderData, useNavigation} from 'react-router';
import type {Route} from './+types/pago.payphone.cancelado';
import {
  BackToStoreLink,
  PaymentStatus,
  RetryPaymentButton,
} from '~/components/checkout/PaymentStatus';

export const meta: Route.MetaFunction = () => [
  {title: 'Pago cancelado | Biothree Ecuador'},
  {name: 'robots', content: 'noindex'},
];

export async function loader({request}: Route.LoaderArgs) {
  const pedido = new URL(request.url).searchParams.get('pedido') ?? '';
  return {orderLegacyId: /^\d+$/.test(pedido) ? pedido : null};
}

export default function PayphoneCancelledPage() {
  const {orderLegacyId} = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  return (
    <PaymentStatus
      tone="warning"
      title="Pago cancelado"
      actions={
        <>
          {orderLegacyId && (
            <RetryPaymentButton orderLegacyId={orderLegacyId} busy={navigation.state !== 'idle'} />
          )}
          <BackToStoreLink />
        </>
      }
    >
      <p className="bt-p text-muted">
        Cerraste el formulario de PayPhone antes de completar el pago. No se
        realizó ningún cobro.
      </p>
      {orderLegacyId ? (
        <p className="bt-p text-muted">
          Tu pedido sigue reservado: puedes pagarlo ahora o más tarde desde el
          enlace de tu confirmación.
        </p>
      ) : (
        <p className="bt-p text-muted">
          Vuelve al carrito para finalizar tu compra cuando quieras.
        </p>
      )}
    </PaymentStatus>
  );
}
