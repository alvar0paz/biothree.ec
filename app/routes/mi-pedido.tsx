import {
  data,
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from 'react-router';
import type {Route} from './+types/mi-pedido';
import {PaymentChallenge} from '~/components/checkout/PaymentChallenge';
import {buttonClasses} from '~/components/marketing/Button';
import {
  getOrder,
  hasAdminCredentials,
  isOrderPaid,
  orderGid,
} from '~/lib/shopify-admin';
import {
  DEUNA_TAG,
  limitedForm,
  verifyChallenge,
  PRIVATE_HEADERS,
  deunaReady,
  findCustomerOrder,
  readReview,
  sameOrigin,
  uploadReceipt,
} from '~/lib/deuna.server';

export const meta = () => [
  {title: 'Consultar mi pedido | BIO-THREE'},
  {name: 'robots', content: 'noindex'},
];
export const headers = () => PRIVATE_HEADERS;
export async function loader({context}: Route.LoaderArgs) {
  const {env, session} = context;
  const access = session.get('orderAccess') as
    | {id: string; expires: number}
    | undefined;
  if (!hasAdminCredentials(env) || !access || access.expires < Date.now())
    return {
      sitekey: env.PAYMENT_TURNSTILE_SITE_KEY,
      order: null,
      review: null,
      canUpload: false,
    };
  const order = await getOrder(env, orderGid(access.id));
  if (!order)
    return {
      sitekey: env.PAYMENT_TURNSTILE_SITE_KEY,
      order: null,
      review: null,
      canUpload: false,
    };
  const review = order.tags.includes(DEUNA_TAG)
    ? (await readReview(env, order.id)).value
    : null;
  return {
    sitekey: env.PAYMENT_TURNSTILE_SITE_KEY,
    order: {
      name: order.name,
      id: order.legacyResourceId,
      amount: order.totalOutstanding,
      paid: isOrderPaid(order),
      cancelled: Boolean(order.cancelledAt),
      financial: order.displayFinancialStatus ?? '',
      fulfillment: order.displayFulfillmentStatus,
      method: order.tags.includes(DEUNA_TAG) ? 'Deuna' : 'PayPhone',
    },
    review: review ? {status: review.status, reason: review.reason} : null,
    canUpload:
      deunaReady(env) &&
      order.tags.includes(DEUNA_TAG) &&
      order.displayFinancialStatus === 'PENDING' &&
      !order.cancelledAt &&
      (!review || review.status === 'rejected'),
  };
}
export async function action({request, context}: Route.ActionArgs) {
  sameOrigin(request);
  if (Number(request.headers.get('Content-Length')) > 6 * 1024 * 1024)
    throw new Response('Archivo demasiado grande', {status: 413});
  const form = await limitedForm(request);
  const {session, env} = context;
  const intent = form.get('intent');
  if (intent === 'exit') {
    session.unset('orderAccess');
    return redirect('/mi-pedido');
  }
  if (intent === 'lookup') {
    if (!(await verifyChallenge(request, env, form, 'lookup')))
      return data(
        {error: 'Completa la verificación de seguridad e inténtalo de nuevo.'},
        {status: 400, headers: PRIVATE_HEADERS},
      );
    const order = await findCustomerOrder(
      env,
      String(form.get('number') ?? ''),
      String(form.get('email') ?? ''),
    );
    if (!order)
      return data(
        {
          error:
            'No encontramos un pedido con esos datos. Revisa el número y el correo de compra.',
        },
        {status: 400, headers: PRIVATE_HEADERS},
      );
    session.set('orderAccess', {
      id: order.legacyResourceId,
      expires: Date.now() + 30 * 60 * 1000,
    });
    return redirect('/mi-pedido');
  }
  if (intent !== 'upload' || !deunaReady(env))
    throw new Response('Servicio no disponible', {status: 503});
  const access = session.get('orderAccess') as
    | {id: string; expires: number}
    | undefined;
  if (!access || access.expires < Date.now()) return redirect('/mi-pedido');
  const order = await getOrder(env, orderGid(access.id));
  if (!order) throw new Response('Pedido no encontrado', {status: 404});
  const file = form.get('receipt');
  if (!(file instanceof File))
    return data({error: 'Selecciona tu comprobante.'}, {status: 400});
  try {
    await uploadReceipt(env, order, file);
  } catch (error) {
    return data(
      {
        error:
          error instanceof Response
            ? await error.text()
            : 'No pudimos guardar el comprobante. Inténtalo nuevamente.',
      },
      {
        status: error instanceof Response ? error.status : 502,
        headers: PRIVATE_HEADERS,
      },
    );
  }
  return redirect('/mi-pedido');
}
const input = 'rounded-control border border-line p-3 bg-white text-ink';
export default function OrderPage() {
  const {sitekey, order, review, canUpload} = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const busy = useNavigation().state !== 'idle';
  return (
    <div className="biothree">
      <main className="bt-container bt-section-compact max-w-2xl space-y-6">
        <h1 className="bt-h2 text-ink">
          {order ? `Pedido ${order.name}` : 'Consulta tu pedido'}
        </h1>
        {result?.error && (
          <p role="alert" className="bt-p text-red-800">
            {result.error}
          </p>
        )}
        {!order ? (
          <Form method="post" className="flex flex-col gap-4">
            <p className="bt-p text-muted">
              Ingresa el número de pedido y el correo que usaste al comprar.
            </p>
            <label className="flex flex-col gap-2">
              Número de pedido
              <input
                className={input}
                name="number"
                placeholder="#1001"
                inputMode="numeric"
                maxLength={13}
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              Correo electrónico
              <input
                className={input}
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
              />
            </label>
            <PaymentChallenge
              sitekey={sitekey}
              action="lookup"
              resetKey={result}
            />
            <button
              className={buttonClasses({})}
              name="intent"
              value="lookup"
              disabled={busy}
            >
              {busy ? 'Consultando…' : 'Consultar estado'}
            </button>
          </Form>
        ) : (
          <>
            <p className="bt-note text-muted">Método de pago: {order.method}</p>
            <h2 className="bt-h3 text-ink">
              {order.cancelled
                ? 'Pedido cancelado'
                : ['REFUNDED', 'PARTIALLY_REFUNDED'].includes(order.financial)
                  ? 'Pago reembolsado total o parcialmente'
                  : order.paid
                    ? 'Pago confirmado'
                    : review?.status === 'review' ||
                        review?.status === 'approving'
                      ? 'Comprobante recibido · en revisión'
                      : review?.status === 'rejected'
                        ? 'Necesitamos revisar tu comprobante'
                        : 'Pendiente de pago'}
            </h2>
            {!order.cancelled &&
              !order.paid &&
              (review?.status === 'review' ||
                review?.status === 'approving') && (
                <p className="bt-p text-muted">
                  Revisaremos tu pago y te enviaremos la confirmación por correo
                  en cuanto lo verifiquemos. No necesitas pagar de nuevo.
                </p>
              )}
            {order.paid && (
              <p className="bt-p">
                {order.fulfillment === 'FULFILLED'
                  ? 'Pedido despachado.'
                  : order.fulfillment === 'PARTIALLY_FULFILLED'
                    ? 'Pedido despachado parcialmente.'
                    : 'Pago confirmado · listo para preparar.'}
              </p>
            )}
            {review?.reason && <p className="bt-p">{review.reason}</p>}
            {canUpload && (
              <section className="space-y-5">
                <p className="bt-price text-ink">
                  Total a pagar: {order.amount.currencyCode}{' '}
                  {order.amount.amount}
                </p>
                <p className="bt-p">
                  Escanea el QR con Deuna, verifica el destinatario{' '}
                  <strong>BIOSTRADE GLOBAL CIA. LTDA.</strong> e ingresa el
                  importe exacto. Luego sube una imagen de tu comprobante.
                </p>
                <img
                  src="/payments/deuna-biostrade.png"
                  alt="QR Deuna de BIOSTRADE GLOBAL CIA. LTDA."
                  className="w-full max-w-sm mx-auto"
                />
                <a
                  className="underline"
                  href="/payments/deuna-biostrade.pdf"
                  download
                >
                  Descargar QR original
                </a>
                {review?.status === 'rejected' && (
                  <p className="bt-note">
                    Revisa primero tu movimiento en Deuna. No realices otro pago
                    si ya fue debitado.
                  </p>
                )}
                <Form
                  method="post"
                  encType="multipart/form-data"
                  className="flex flex-col gap-4"
                >
                  <label className="flex flex-col gap-2">
                    Comprobante de pago
                    <input
                      name="receipt"
                      type="file"
                      accept="image/jpeg,image/png"
                      required
                    />
                  </label>
                  <p className="bt-note text-muted">
                    JPG o PNG · hasta 5 MB. Evita incluir movimientos o datos
                    ajenos a este pago.
                  </p>
                  <button
                    className={buttonClasses({})}
                    name="intent"
                    value="upload"
                    disabled={busy}
                  >
                    {busy ? 'Guardando comprobante…' : 'Enviar comprobante'}
                  </button>
                </Form>
              </section>
            )}
            {!order.cancelled &&
              !order.paid &&
              order.method === 'PayPhone' &&
              order.financial === 'PENDING' && (
                <a className={buttonClasses({})} href={`/pagar/${order.id}`}>
                  Continuar con PayPhone
                </a>
              )}
            <a className="block underline" href="/mi-pedido">
              Actualizar estado
            </a>
            <Form method="post">
              <button className="underline bt-note" name="intent" value="exit">
                Consultar otro pedido
              </button>
            </Form>
          </>
        )}
      </main>
    </div>
  );
}
