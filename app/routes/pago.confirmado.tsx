import {data, redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/pago.confirmado';
import {getFlowEnv} from '~/lib/payphone-flow';
import {adminRequest, orderGid} from '~/lib/shopify-admin';
import {PURCHASE_QUERY, purchaseFromOrder, type PurchaseQuery} from '~/lib/measurement';
import {CommerceView} from '~/components/Measurement';
import {PaymentStatus, BackToStoreLink} from '~/components/checkout/PaymentStatus';
import {shipping} from '~/data/shipping';

export const meta: Route.MetaFunction = () => [{title: 'Compra confirmada | Biothree Ecuador'}, {name: 'robots', content: 'noindex'}];

export async function loader({context}: Route.LoaderArgs) {
  const receipt = context.session.get('measurementReceipt') as {orderId: string; expires: number} | undefined;
  if (!receipt || receipt.expires < Date.now() || !/^\d+$/.test(receipt.orderId)) return redirect('/');
  const env = getFlowEnv(context.env);
  if (!env) throw new Response('Verificación no disponible', {status: 503});
  // Read the paid Shopify order again. A URL or client cart can never create a purchase.
  let purchase = null;
  try {
    const result = await adminRequest<PurchaseQuery>(env, PURCHASE_QUERY, {id: orderGid(receipt.orderId)});
    purchase = purchaseFromOrder(result.order);
  } catch { /* Measurement failures must not turn a successful payment into an error. */ }
  return data({purchase}, {headers: {'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer'}});
}

export default function Confirmed() {
  const {purchase} = useLoaderData<typeof loader>();
  return <>
    <PaymentStatus tone="success" title="¡Pago confirmado!" actions={<BackToStoreLink>Volver al inicio</BackToStoreLink>}>
      <p className="bt-p text-muted">Recibimos tu pago. Te enviamos la confirmación del pedido por correo.</p>
      <p className="bt-p text-muted">{shipping.cutoff}</p>
      <p className="bt-p text-muted">{shipping.tracking}</p>
    </PaymentStatus>
    {purchase && <CommerceView name="purchase" data={purchase} eventKey={purchase.transaction_id} />}
  </>;
}
