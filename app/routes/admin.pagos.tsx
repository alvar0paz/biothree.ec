import {
  data,
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from 'react-router';
import type {Route} from './+types/admin.pagos';
import {PaymentChallenge} from '~/components/checkout/PaymentChallenge';
import {buttonClasses} from '~/components/marketing/Button';
import {adminRequest} from '~/lib/shopify-admin';
import {
  adminSession,
  confirmationDraft,
  deunaReady,
  limitedForm,
  verifyChallenge,
  PRIVATE_HEADERS,
  readReview,
  requireAdmin,
  reviewPayment,
  sameOrigin,
  secretMatches,
} from '~/lib/deuna.server';
export const meta = () => [
  {title: 'Revisión de pagos | BIO-THREE'},
  {name: 'robots', content: 'noindex'},
];
export const headers = () => PRIVATE_HEADERS;
export async function loader({request, context}: Route.LoaderArgs) {
  if (!deunaReady(context.env))
    return {
      sitekey: context.env.PAYMENT_TURNSTILE_SITE_KEY,
      configured: false,
      authenticated: false,
      orders: [],
      next: null,
    };
  if (!(await adminSession(request, context.env)).valid)
    return {
      sitekey: context.env.PAYMENT_TURNSTILE_SITE_KEY,
      configured: true,
      authenticated: false,
      orders: [],
      next: null,
    };
  const cursor = new URL(request.url).searchParams.get('after');
  const result = await adminRequest<{
    orders: {
      nodes: {
        id: string;
        legacyResourceId: string;
        name: string;
        email: string | null;
        displayFinancialStatus: string;
        totalOutstandingSet: {
          shopMoney: {amount: string; currencyCode: string};
        };
      }[];
      pageInfo: {hasNextPage: boolean; endCursor: string};
    };
  }>(
    context.env,
    `query DeunaQueue($after: String) { orders(first: 25, after: $after, query: "tag:deuna-checkout", sortKey: CREATED_AT, reverse: true) { nodes { id legacyResourceId name email displayFinancialStatus totalOutstandingSet { shopMoney { amount currencyCode } } } pageInfo { hasNextPage endCursor } } }`,
    {after: cursor},
  );
  const orders = await Promise.all(
    result.orders.nodes.map(async (order) => {
      const review = await readReview(context.env, order.id);
      return {
        ...order,
        review,
        draft: review.value
          ? confirmationDraft(
              context.env.PAYMENT_CONFIRMATION_EMAIL!,
              order,
              review.value,
            )
          : null,
      };
    }),
  );
  return {
    sitekey: context.env.PAYMENT_TURNSTILE_SITE_KEY,
    configured: true,
    authenticated: true,
    orders,
    next: result.orders.pageInfo.hasNextPage
      ? result.orders.pageInfo.endCursor
      : null,
  };
}
export async function action({request, context}: Route.ActionArgs) {
  sameOrigin(request);
  if (!deunaReady(context.env))
    throw new Response('Configuración pendiente', {status: 503});
  const form = await limitedForm(request, 16 * 1024);
  const auth = await adminSession(request, context.env);
  const intent = String(form.get('intent'));
  if (intent === 'login') {
    if (!(await verifyChallenge(request, context.env, form, 'admin-login')))
      return data(
        {
          message:
            'Completa la verificación de seguridad e inténtalo de nuevo.',
        },
        {status: 400, headers: PRIVATE_HEADERS},
      );
    if (
      !(await secretMatches(
        String(form.get('password') ?? ''),
        context.env.PAYMENT_ADMIN_SECRET!,
      ))
    )
      return data(
        {message: 'Acceso no válido.'},
        {status: 401, headers: PRIVATE_HEADERS},
      );
    auth.session.set('key', auth.key);
    auth.session.set('expires', Date.now() + 3600000);
    return redirect('/admin/pagos', {
      headers: {
        ...PRIVATE_HEADERS,
        'Set-Cookie': await auth.storage.commitSession(auth.session),
      },
    });
  }
  await requireAdmin(request, context.env);
  if (intent === 'logout')
    return redirect('/admin/pagos', {
      headers: {
        ...PRIVATE_HEADERS,
        'Set-Cookie': await auth.storage.destroySession(auth.session),
      },
    });
  if (!['approve', 'reject', 'email-sent'].includes(intent))
    throw new Response('Acción no válida', {status: 400});
  if (intent === 'approve' && form.get('verified') !== 'yes')
    return data(
      {message: 'Confirma primero que verificaste el pago en Deuna.'},
      {status: 400},
    );
  if (intent === 'email-sent' && form.get('emailConfirmed') !== 'yes')
    return data(
      {message: 'Confirma que ya enviaste el correo desde Gmail.'},
      {status: 400, headers: PRIVATE_HEADERS},
    );
  const id = String(form.get('orderId'));
  if (!/^\d+$/.test(id)) throw new Response('Pedido no válido', {status: 400});
  try {
    const result = await reviewPayment(
      context.env,
      id,
      intent as 'approve' | 'reject' | 'email-sent',
      String(form.get('reason') ?? ''),
      String(form.get('digest') ?? ''),
    );
    return data(
      {
        message: result.emailPending
          ? 'Revisión guardada. Abre el mensaje en Gmail para enviar la confirmación.'
          : 'Envío manual registrado. El estado del pago no cambió.',
      },
      {headers: PRIVATE_HEADERS},
    );
  } catch (error) {
    return data(
      {
        message:
          error instanceof Response
            ? await error.text()
            : 'No se completó la operación. Actualiza y revisa el estado antes de reintentar.',
      },
      {
        status: error instanceof Response ? error.status : 502,
        headers: PRIVATE_HEADERS,
      },
    );
  }
}
export default function ReviewPage() {
  const {sitekey, configured, authenticated, orders, next} =
    useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const busy = useNavigation().state !== 'idle';
  return (
    <div className="biothree">
      <main className="bt-container bt-section-compact space-y-6">
        <h1 className="bt-h2">Revisión de pagos Deuna</h1>
        {result?.message && (
          <p role="status" className="bt-p">
            {result.message}
          </p>
        )}
        {!configured ? (
          <p>
            La revisión de pagos está en preparación. Deuna aún no está
            habilitado.
          </p>
        ) : !authenticated ? (
          <Form method="post" className="flex flex-col gap-4 max-w-sm">
            <label className="flex flex-col gap-2">
              Clave de administración
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="border border-line rounded-control p-3"
              />
            </label>
            <PaymentChallenge
              sitekey={sitekey}
              action="admin-login"
              resetKey={result}
            />
            <button
              className={buttonClasses({})}
              name="intent"
              value="login"
              disabled={busy}
            >
              Entrar
            </button>
          </Form>
        ) : (
          <>
            <Form method="post">
              <button className="underline" name="intent" value="logout">
                Cerrar sesión
              </button>
            </Form>
            <p className="bt-note">
              Verifica el movimiento recibido en tu cuenta Deuna. Una imagen del
              comprobante por sí sola no confirma el pago.
            </p>
            {!orders.length && <p>No hay pedidos Deuna.</p>}
            {orders.map((order) => (
              <section
                key={order.id}
                className="border-t border-line py-6 space-y-4"
              >
                <h2 className="bt-h3">
                  {order.name} ·{' '}
                  {order.totalOutstandingSet.shopMoney.currencyCode}{' '}
                  {order.totalOutstandingSet.shopMoney.amount} pendiente
                </h2>
                <p>
                  Shopify: {order.displayFinancialStatus} · Comprobante:{' '}
                  {order.review.value?.status ?? 'sin enviar'}
                </p>
                {order.review.value && (
                  <>
                    <a
                      className="underline"
                      href={`/admin/pagos/comprobante/${order.legacyResourceId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir comprobante privado
                    </a>
                    <p>
                      Importe al recibir el comprobante:{' '}
                      {order.review.value.currency} {order.review.value.amount}
                    </p>
                    <Form
                      method="post"
                      className="flex flex-col gap-4 max-w-xl"
                    >
                      <input
                        type="hidden"
                        name="orderId"
                        value={order.legacyResourceId}
                      />
                      <input
                        type="hidden"
                        name="digest"
                        value={order.review.digest ?? ''}
                      />
                      {['review', 'approving'].includes(
                        order.review.value.status,
                      ) && (
                        <>
                          <label>
                            <input
                              type="checkbox"
                              name="verified"
                              value="yes"
                            />{' '}
                            Verifiqué destinatario, importe y movimiento
                            recibido en Deuna.
                          </label>
                          <button
                            className={buttonClasses({})}
                            name="intent"
                            value="approve"
                            disabled={busy}
                          >
                            {order.review.value.status === 'approving'
                              ? 'Completar aprobación pendiente'
                              : 'Confirmar pago'}
                          </button>
                          {order.review.value.status === 'review' && (
                            <>
                              <label className="flex flex-col gap-2">
                                Motivo si no se puede verificar
                                <textarea
                                  className="border border-line p-3"
                                  name="reason"
                                  maxLength={500}
                                />
                              </label>
                              <button
                                className="underline"
                                name="intent"
                                value="reject"
                                disabled={busy}
                              >
                                Solicitar otro comprobante
                              </button>
                            </>
                          )}
                        </>
                      )}
                      {['approved', 'rejected'].includes(
                        order.review.value.status,
                      ) &&
                        !order.review.value.emailSentAt && (
                          <>
                            {order.draft ? (
                              <>
                                <a
                                  className={buttonClasses({})}
                                  href={order.draft.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Enviar confirmación · abrir Gmail
                                </a>
                                <p className="bt-note">
                                  Se abre un borrador para {order.draft.to}.
                                  Revisa el remitente info@biostradeglobal.com y
                                  pulsa Enviar en Gmail. Abrir el borrador no
                                  envía el correo.
                                </p>
                                <label>
                                  <input
                                    type="checkbox"
                                    name="emailConfirmed"
                                    value="yes"
                                  />{' '}
                                  Ya envié este mensaje desde Gmail.
                                </label>
                                <button
                                  className="underline"
                                  name="intent"
                                  value="email-sent"
                                  disabled={busy}
                                >
                                  Registrar correo enviado
                                </button>
                              </>
                            ) : (
                              <p>
                                Este pedido no tiene correo. Revisa sus datos en
                                Shopify.
                              </p>
                            )}
                          </>
                        )}
                      {order.review.value.emailSentAt && (
                        <p className="bt-note">
                          Envío registrado manualmente; entrega no verificada.
                        </p>
                      )}
                    </Form>
                  </>
                )}
              </section>
            ))}
            {next && (
              <a
                className="underline"
                href={`?after=${encodeURIComponent(next)}`}
              >
                Ver pedidos anteriores
              </a>
            )}
          </>
        )}
      </main>
    </div>
  );
}
