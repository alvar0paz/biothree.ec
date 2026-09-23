// Pay (or retry paying) an existing pending order with PayPhone. Where the
// checkout sends the customer when PayPhone could not be reached, where the
// cancel/response pages send them to try again, and a link staff can share
// by hand ("/pagar/<id del pedido>").
//
// GET shows the order number and amount; POST registers a new PayPhone
// attempt and redirects to the hosted card form. The page reveals nothing
// beyond the order number and the outstanding amount.

import {data, Form, redirect, useActionData, useLoaderData, useNavigation} from 'react-router';
import type {Route} from './+types/pagar.$orderId';
import {Money} from '@shopify/hydrogen';
import {buttonClasses} from '~/components/marketing/Button';
import {BackToStoreLink, PaymentStatus} from '~/components/checkout/PaymentStatus';
import {getFlowEnv, payphoneReturnUrls, startPayphonePayment} from '~/lib/payphone-flow';
import {getOrder, isOrderPaid, orderGid} from '~/lib/shopify-admin';

export const meta: Route.MetaFunction = ({data: loaderData}) => [
  {title: `Pagar pedido ${loaderData?.order.name ?? ''} | Biothree Ecuador`},
  {name: 'robots', content: 'noindex'},
];

const PAYPHONE_ERROR =
  'No pudimos conectar con PayPhone. Tu pedido está reservado; inténtalo de nuevo en un momento.';

async function loadOrder(context: Route.LoaderArgs['context'], orderId: string | undefined) {
  if (!orderId || !/^\d+$/.test(orderId)) throw new Response('Pedido no encontrado', {status: 404});
  const flowEnv = getFlowEnv(context.env);
  if (!flowEnv) throw new Response('Pagos no disponibles', {status: 503});
  const order = await getOrder(flowEnv, orderGid(orderId));
  if (!order) throw new Response('Pedido no encontrado', {status: 404});
  return {flowEnv, order};
}

export async function loader({params, context, request}: Route.LoaderArgs) {
  const {order} = await loadOrder(context, params.orderId);
  const error = new URL(request.url).searchParams.get('error');
  return {
    order: {
      legacyResourceId: order.legacyResourceId,
      name: order.name,
      amount: order.totalOutstanding,
      paid: isOrderPaid(order),
    },
    error: error === 'payphone' ? PAYPHONE_ERROR : null,
  };
}

export async function action({params, context, request}: Route.ActionArgs) {
  const {flowEnv, order} = await loadOrder(context, params.orderId);
  if (isOrderPaid(order)) return redirect(`/pagar/${order.legacyResourceId}`);

  const origin = new URL(request.url).origin;
  try {
    const {url} = await startPayphonePayment(
      order,
      flowEnv,
      payphoneReturnUrls(origin, order.legacyResourceId),
    );
    return redirect(url);
  } catch (error) {
    console.error(`PayPhone prepare failed for ${order.name}:`, error);
    return data({error: PAYPHONE_ERROR}, {status: 502});
  }
}

export default function PayOrderPage() {
  const {order, error} = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const busy = navigation.state !== 'idle';
  const message = actionData?.error ?? error;

  if (order.paid) {
    return (
      <PaymentStatus
        tone="success"
        eyebrow={`Pedido ${order.name}`}
        title="Este pedido ya está pagado"
        actions={<BackToStoreLink />}
      >
        <p className="bt-p text-muted">
          No hace falta hacer nada más. Te avisamos por correo cuando salga
          de nuestras instalaciones.
        </p>
      </PaymentStatus>
    );
  }

  return (
    <PaymentStatus
      tone="info"
      eyebrow={`Pedido ${order.name}`}
      title="Completa tu pago con PayPhone"
      actions={
        <>
          <Form method="post">
            <button type="submit" className={buttonClasses({size: 'lg'})} disabled={busy} aria-busy={busy}>
              {busy ? 'Redirigiendo a PayPhone…' : 'Pagar con PayPhone'}
            </button>
          </Form>
          <BackToStoreLink />
        </>
      }
    >
      <p className="bt-price text-ink">
        <Money data={order.amount as {amount: string; currencyCode: 'USD'}} />
      </p>
      <p className="bt-p text-muted">
        Te llevamos a la página segura de PayPhone para pagar con tarjeta de
        crédito o débito. Al terminar vuelves aquí con la confirmación.
      </p>
      {message && (
        <p role="alert" className="rounded-control border border-red-200 bg-red-50 px-4 py-3 bt-note text-red-800">
          {message}
        </p>
      )}
    </PaymentStatus>
  );
}
