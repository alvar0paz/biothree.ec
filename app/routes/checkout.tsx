// The storefront's own checkout. Collects contact + shipping details, has
// Shopify price the cart for that address (draft-order quote), creates the
// order as pending payment and sends the customer straight to PayPhone's
// hosted card form. PayPhone brings them back to /pago/payphone/respuesta.
//
// Two steps, one route: step 1 posts `intent=quote`, step 2 carries the same
// fields as hidden inputs and posts `intent=pay`. No client state to lose.

import {CommerceView} from '~/components/Measurement';
import {useState} from 'react';
import {
  data,
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from 'react-router';
import type {Route} from './+types/checkout';
import {Money} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {buttonClasses} from '~/components/marketing/Button';
import {CheckoutFields} from '~/components/checkout/CheckoutFields';
import {OrderSummary} from '~/components/checkout/OrderSummary';
import {
  CLEAR_CART_COOKIE,
  EMPTY_CHECKOUT_VALUES,
  formatAddress,
  parseCheckoutForm,
  type CheckoutFormErrors,
  type CheckoutFormValues,
} from '~/lib/checkout';
import {
  getFlowEnv,
  payphoneReturnUrls,
  startPayphonePayment,
} from '~/lib/payphone-flow';
import {
  CheckoutError,
  createPendingOrder,
  quoteCheckout,
  type CheckoutInput,
  type CheckoutQuote,
} from '~/lib/shopify-checkout';
import {hasAdminCredentials, type PaymentOrder} from '~/lib/shopify-admin';
import {deunaReady, sameOrigin} from '~/lib/deuna.server';

export const meta: Route.MetaFunction = () => [
  {title: 'Finalizar compra | Biothree Ecuador'},
  {name: 'robots', content: 'noindex'},
];

const GENERIC_ERROR =
  'No pudimos procesar tu pedido en este momento. Revisa tu conexión y vuelve a intentarlo; si el problema sigue, escríbenos por Instagram.';
const NO_SHIPPING_ERROR =
  'No tenemos envío configurado para esa dirección. Revisa la provincia y la ciudad, o escríbenos para coordinar la entrega.';

type ActionData =
  | {
      step: 'details';
      values: CheckoutFormValues;
      errors: CheckoutFormErrors;
      formError?: string;
    }
  | {
      step: 'review';
      values: CheckoutFormValues;
      quote: CheckoutQuote;
      shippingRateHandle: string;
      formError?: string;
    };

function cartLines(cart: CartApiQueryFragment | null) {
  return (cart?.lines?.nodes ?? []).map((line) => ({
    variantId: line.merchandise.id,
    quantity: line.quantity,
  }));
}

function applicableDiscountCodes(cart: CartApiQueryFragment | null) {
  return (cart?.discountCodes ?? [])
    .filter((discount) => discount.applicable)
    .map((discount) => discount.code);
}

function userMessage(error: unknown): string {
  // Permission problems ("must have access to ...") are ours to fix, not
  // the customer's; they stay in the server log.
  return error instanceof CheckoutError &&
    error.userFacing &&
    !/must have access/i.test(error.message)
    ? `Shopify no aceptó el pedido: ${error.message.replace(/^\w+: /, '')}`
    : GENERIC_ERROR;
}

export async function loader({context}: Route.LoaderArgs) {
  const {cart, env} = context;
  const cartData = await cart.get();
  if (!cartData?.lines?.nodes?.length) return redirect('/cart');

  // Without the Admin + PayPhone secrets (local preview, mock store) fall
  // back to Shopify's hosted checkout so the store keeps selling.
  if (!getFlowEnv(env) && !deunaReady(env)) {
    if (cartData.checkoutUrl) return redirect(cartData.checkoutUrl);
    throw new Response('Checkout no disponible', {status: 503});
  }

  const buyer = cartData.buyerIdentity;
  return {
    cart: cartData,
    deunaEnabled: deunaReady(env),
    payphoneEnabled: Boolean(getFlowEnv(env)),
    prefill: {
      email: buyer?.email ?? buyer?.customer?.email ?? '',
      phone: buyer?.phone ?? '',
      firstName: buyer?.customer?.firstName ?? '',
      lastName: buyer?.customer?.lastName ?? '',
    },
  };
}

export async function action({request, context}: Route.ActionArgs) {
  const {cart, env} = context;
  const flowEnv = getFlowEnv(env);
  if (!hasAdminCredentials(env) || (!flowEnv && !deunaReady(env)))
    throw new Response('Checkout no disponible', {status: 503});
  sameOrigin(request);

  const formData = await request.formData();
  const intent = String(formData.get('intent') ?? 'quote');
  const parsed = parseCheckoutForm(formData);
  const paymentMethod =
    formData.get('paymentMethod') === 'deuna' ? 'deuna' : 'payphone';
  if (
    intent === 'pay' &&
    (paymentMethod === 'deuna' ? !deunaReady(env) : !flowEnv)
  )
    throw new Response('Método de pago no disponible', {status: 503});

  if (intent === 'edit') {
    return data<ActionData>({
      step: 'details',
      values: parsed.values,
      errors: {},
    });
  }
  if (!parsed.ok || !parsed.normalized) {
    return data<ActionData>(
      {step: 'details', values: parsed.values, errors: parsed.errors},
      {status: 400},
    );
  }

  const cartData = await cart.get();
  const lines = cartLines(cartData);
  if (!lines.length) return redirect('/cart');

  const requested = String(formData.get('shippingRateHandle') ?? '') || null;
  const input: CheckoutInput = {
    lines,
    paymentMethod,
    email: parsed.normalized.email,
    phone: parsed.normalized.phone,
    address: parsed.normalized.address,
    discountCodes: applicableDiscountCodes(cartData),
    documentId: parsed.normalized.documentId,
    shippingRateHandle: requested,
  };

  const detailsError = (formError: string, status: number) =>
    data<ActionData>(
      {step: 'details', values: parsed.values, errors: {}, formError},
      {status},
    );

  // Quote (or re-quote after changing the shipping option): make sure the
  // totals shown include a rate Shopify actually offers for the address.
  // Null when Shopify offers no rate at all for it.
  const quoteFor = async (): Promise<Extract<
    ActionData,
    {step: 'review'}
  > | null> => {
    let quote = await quoteCheckout(env, input);
    const offered = quote.shippingRates.map((rate) => rate.handle);
    const handle =
      requested && offered.includes(requested) ? requested : offered[0];
    if (!handle) return null;
    if (handle !== requested) {
      quote = await quoteCheckout(env, {...input, shippingRateHandle: handle});
    }
    return {
      step: 'review',
      values: parsed.values,
      quote,
      shippingRateHandle: handle,
    };
  };

  if (intent !== 'pay' || !requested) {
    try {
      const review = await quoteFor();
      return review ?? detailsError(NO_SHIPPING_ERROR, 400);
    } catch (error) {
      console.error('Checkout quote failed:', error);
      return detailsError(userMessage(error), 502);
    }
  }

  let order: PaymentOrder;
  try {
    order = await createPendingOrder(env, {
      ...input,
      shippingRateHandle: requested,
    });
  } catch (error) {
    console.error('Checkout order creation failed:', error);
    try {
      const review = await quoteFor();
      if (!review) return detailsError(NO_SHIPPING_ERROR, 400);
      return data<ActionData>(
        {...review, formError: userMessage(error)},
        {status: 502},
      );
    } catch (quoteError) {
      console.error('Checkout re-quote failed:', quoteError);
      return detailsError(userMessage(error), 502);
    }
  }

  context.session.set('measurementOrder', order.legacyResourceId);

  // The order now owns the items: an empty cart is what the customer should
  // find if they come back without paying (the order itself stays payable
  // from /pagar/<id>).
  const headers = new Headers({'Set-Cookie': CLEAR_CART_COOKIE});
  context.session.set('orderAccess', {
    id: order.legacyResourceId,
    expires: Date.now() + 30 * 60 * 1000,
  });
  if (paymentMethod === 'deuna') return redirect('/mi-pedido', {headers});
  if (!flowEnv) throw new Response('PayPhone no disponible', {status: 503});
  const origin = new URL(request.url).origin;
  try {
    const {url} = await startPayphonePayment(
      order,
      flowEnv,
      payphoneReturnUrls(origin, order.legacyResourceId),
    );
    return redirect(url, {headers});
  } catch (error) {
    console.error(`PayPhone prepare failed for ${order.name}:`, error);
    return redirect(`/pagar/${order.legacyResourceId}?error=payphone`, {
      headers,
    });
  }
}

export default function CheckoutPage() {
  const {cart, prefill, deunaEnabled, payphoneEnabled} =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>() as ActionData | undefined;
  const navigation = useNavigation();
  const busy = navigation.state !== 'idle';
  const submitting = navigation.formData?.get('intent');

  const step = actionData?.step ?? 'details';
  const values: CheckoutFormValues = actionData?.values ?? {
    ...EMPTY_CHECKOUT_VALUES,
    ...prefill,
  };
  const quote = actionData?.step === 'review' ? actionData.quote : null;
  const stepError = actionData?.formError;

  return (
    <div className="biothree">
      <CommerceView name="begin_checkout" eventKey={cart.id.split('?')[0]} data={{currency: cart.cost.subtotalAmount.currencyCode, value: Number(cart.cost.subtotalAmount.amount), items: cart.lines.nodes.map(line => ({item_id: line.merchandise.id.split('/').pop()!, quantity: line.quantity, price: Number(line.merchandise.price.amount)}))}} />
      <div className="bt-container bt-section-compact">
        <div className="flex flex-col gap-2">
          <h1 className="bt-h2 text-ink">Finalizar compra</h1>
          <ol
            className="flex flex-wrap gap-x-6 gap-y-1 bt-note text-muted"
            aria-label="Pasos"
          >
            <li className={step === 'details' ? 'font-medium text-ink' : ''}>
              1. Tus datos
            </li>
            <li className={step === 'review' ? 'font-medium text-ink' : ''}>
              2. Envío y pago
            </li>
            <li>3. Completar pago</li>
          </ol>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
          <div className="min-w-0">
            {stepError && (
              <p
                role="alert"
                className="mb-6 rounded-control border border-red-200 bg-red-50 px-4 py-3 bt-note text-red-800"
              >
                {stepError}
              </p>
            )}
            {step === 'details' ? (
              <Form method="post" className="flex flex-col gap-8">
                <CheckoutFields
                  values={values}
                  errors={
                    actionData?.step === 'details' ? actionData.errors : {}
                  }
                />
                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    name="intent"
                    value="quote"
                    className={buttonClasses({className: 'w-full sm:w-auto'})}
                    disabled={busy}
                    aria-busy={busy}
                  >
                    {busy && submitting === 'quote'
                      ? 'Calculando envío…'
                      : 'Continuar al envío'}
                  </button>
                  <p className="bt-note text-muted">
                    {deunaEnabled
                      ? 'Elige PayPhone o Deuna en el siguiente paso.'
                      : 'Pagarás con tarjeta en la página segura de PayPhone. No necesitas tener la app.'}
                  </p>
                </div>
              </Form>
            ) : (
              actionData?.step === 'review' && (
                <ReviewStep
                  deunaEnabled={deunaEnabled}
                  payphoneEnabled={payphoneEnabled}
                  values={values}
                  quote={actionData.quote}
                  shippingRateHandle={actionData.shippingRateHandle}
                />
              )
            )}
          </div>
          <aside className="lg:order-none">
            <OrderSummary cart={cart} quote={quote} />
          </aside>
        </div>
      </div>
    </div>
  );
}

/**
 * Step 2. A plain document form, not React Router's <Form>: the "pay"
 * submit answers with a redirect to PayPhone, and letting the browser follow
 * that 302 natively keeps the Referer (PayPhone's domain check) and the
 * cart-clearing cookie intact, with no client router in between.
 */
function ReviewStep({
  deunaEnabled,
  payphoneEnabled,
  values,
  quote,
  shippingRateHandle,
}: {
  deunaEnabled: boolean;
  payphoneEnabled: boolean;
  values: CheckoutFormValues;
  quote: CheckoutQuote;
  shippingRateHandle: string;
}) {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [method, setMethod] = useState(payphoneEnabled ? 'payphone' : 'deuna');
  const busy = submitting !== null;
  const address = formatAddress({
    firstName: values.firstName,
    lastName: values.lastName,
    address1: values.address1,
    address2: values.address2 || null,
    city: values.city,
    provinceCode: values.provinceCode,
    zip: values.zip || null,
    phone: values.phone,
  });

  return (
    <form
      method="post"
      className="flex flex-col gap-8"
      onSubmit={(event) => {
        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        const intent =
          submitter instanceof HTMLButtonElement ? submitter.value : 'pay';
        // Only after the browser has serialised the form: a button disabled
        // during the submit event loses its name/value (the intent).
        setTimeout(() => setSubmitting(intent), 0);
      }}
    >
      {Object.entries(values).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="bt-h3 text-ink">Enviar a</h2>
          <button
            type="submit"
            name="intent"
            value="edit"
            formNoValidate
            className="bt-note text-muted underline underline-offset-2 hover:text-ink"
            disabled={busy}
          >
            Editar
          </button>
        </div>
        <p className="bt-p text-ink">
          {values.firstName} {values.lastName}
        </p>
        <p className="bt-p text-muted">{address}</p>
        <p className="bt-note text-muted">
          {values.email} · {values.phone}
        </p>
      </section>

      <fieldset className="flex flex-col gap-3">
        <legend className="bt-h3 mb-3 text-ink">Envío</legend>
        {quote.shippingRates.map((rate) => (
          <label
            key={rate.handle}
            className="flex cursor-pointer items-center gap-3 rounded-control border border-line px-4 py-3 has-[:checked]:border-purple has-[:checked]:bg-purple-soft/40"
          >
            <input
              type="radio"
              name="shippingRateHandle"
              value={rate.handle}
              defaultChecked={rate.handle === shippingRateHandle}
              onChange={(event) => {
                // Re-quote so the totals follow the chosen rate. Without JS
                // the totals simply refresh on the next submit.
                const form = event.currentTarget.form;
                const requote = form?.querySelector<HTMLButtonElement>(
                  'button[value="quote"]',
                );
                if (form && requote) form.requestSubmit(requote);
              }}
              className="h-4 w-4 accent-purple"
            />
            <span className="flex-1 bt-p text-ink">{rate.title}</span>
            <span className="bt-note tabular-nums text-ink">
              {Number(rate.price.amount) === 0 ? (
                'Gratis'
              ) : (
                <Money
                  as="span"
                  data={rate.price as {amount: string; currencyCode: 'USD'}}
                />
              )}
            </span>
          </label>
        ))}
        {quote.shippingRates.length > 1 && (
          <button
            type="submit"
            name="intent"
            value="quote"
            className="self-start bt-note text-muted underline underline-offset-2 hover:text-ink"
            disabled={busy}
          >
            Actualizar totales
          </button>
        )}
        {quote.shippingRates.length <= 1 && (
          <button
            type="submit"
            name="intent"
            value="quote"
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
          >
            Actualizar
          </button>
        )}
      </fieldset>

      <section className="flex flex-col gap-4 border-t border-line pt-6">
        <h2 className="bt-h3 text-ink">Pago</h2>
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Método de pago</legend>
          {payphoneEnabled && (
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="payphone"
                checked={method === 'payphone'}
                onChange={() => setMethod('payphone')}
              />{' '}
              PayPhone · tarjeta de crédito o débito
            </label>
          )}
          {deunaEnabled && (
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="deuna"
                checked={method === 'deuna'}
                onChange={() => setMethod('deuna')}
              />{' '}
              Deuna · QR y comprobante
            </label>
          )}
        </fieldset>
        <p className="bt-p text-muted">
          {method === 'deuna'
            ? 'Verás el QR y el importe de tu pedido. Sube tu comprobante después de pagar; confirmaremos el pago por correo cuando lo verifiquemos.'
            : 'Te llevamos a la página segura de PayPhone para pagar con tarjeta. Al terminar, vuelves a biothree.ec.'}
        </p>
        <button
          type="submit"
          name="intent"
          value="pay"
          className={buttonClasses({size: 'lg', className: 'w-full sm:w-auto'})}
          disabled={busy}
          aria-busy={busy && submitting === 'pay'}
        >
          {submitting === 'pay'
            ? 'Creando tu pedido…'
            : method === 'deuna'
              ? 'Continuar con Deuna'
              : 'Pagar con PayPhone'}
        </button>
        <p className="bt-note text-muted">
          Puedes consultar el estado de tu pedido con su número y tu correo en
          «Mi pedido».
        </p>
      </section>
    </form>
  );
}
