import {AwsClient} from 'aws4fetch';
import {createCookieSessionStorage} from 'react-router';
import {
  adminRequest,
  getOrder,
  hasAdminCredentials,
  isOrderPaid,
  markOrderPaid,
  orderGid,
  type PaymentOrder,
} from './shopify-admin';

export const DEUNA_TAG = 'deuna-checkout';
export const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex',
  'Referrer-Policy': 'no-referrer',
};
export type DeunaEnv = Env & {
  PUBLIC_STORE_DOMAIN: string;
  SESSION_SECRET: string;
};
export type Review = {
  status: 'review' | 'approving' | 'approved' | 'rejected';
  receipt: string;
  mime: string;
  uploadedAt: string;
  amount: string;
  currency: string;
  reviewedAt?: string;
  reason?: string;
  emailSentAt?: string;
};
export type ReviewRecord = {value: Review | null; digest: string | null};
export function deunaReady(env: Partial<DeunaEnv>) {
  return (
    env.DEUNA_ENABLED === 'true' &&
    hasAdminCredentials(env) &&
    Boolean(
      env.RECEIPTS_R2_ACCOUNT_ID &&
      env.RECEIPTS_R2_BUCKET &&
      env.RECEIPTS_R2_ACCESS_KEY_ID &&
      env.RECEIPTS_R2_SECRET_ACCESS_KEY &&
      env.RESEND_API_KEY &&
      env.PAYMENT_EMAIL_FROM &&
      env.PAYMENT_TURNSTILE_SITE_KEY &&
      env.PAYMENT_TURNSTILE_SECRET &&
      env.PAYMENT_ADMIN_SECRET &&
      env.PAYMENT_ADMIN_SECRET.length >= 32 &&
      env.SESSION_SECRET,
    )
  );
}
export function sameOrigin(request: Request) {
  if (
    request.method !== 'POST' ||
    request.headers.get('Origin') !== new URL(request.url).origin
  ) {
    throw new Response('Solicitud no permitida', {
      status: 403,
      headers: PRIVATE_HEADERS,
    });
  }
}
function sessions(env: DeunaEnv) {
  return createCookieSessionStorage({
    cookie: {
      name: '__Host-payment-review',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      secrets: [env.SESSION_SECRET, env.PAYMENT_ADMIN_SECRET!].filter(Boolean),
      maxAge: 3600,
    },
  });
}
export async function adminSession(request: Request, env: DeunaEnv) {
  const storage = sessions(env);
  const session = await storage.getSession(request.headers.get('Cookie'));
  // Rotation invalidates existing sessions, in addition to normal cookie expiry.
  const key = await hash(env.PAYMENT_ADMIN_SECRET ?? '');
  return {
    storage,
    session,
    valid: Boolean(
      env.PAYMENT_ADMIN_SECRET?.length &&
      session.get('key') === key &&
      Number(session.get('expires')) > Date.now(),
    ),
    key,
  };
}
export async function requireAdmin(request: Request, env: DeunaEnv) {
  if (!(await adminSession(request, env)).valid)
    throw new Response('Acceso restringido', {
      status: 401,
      headers: PRIVATE_HEADERS,
    });
}
export async function hash(value: string | ArrayBuffer) {
  const bytes =
    typeof value === 'string' ? new TextEncoder().encode(value) : value;
  return Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
    (x) => x.toString(16).padStart(2, '0'),
  ).join('');
}
export async function secretMatches(input: string, expected: string) {
  const a = await hash(input);
  const b = await hash(expected);
  let different = 0;
  for (let i = 0; i < a.length; i++)
    different |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return different === 0;
}
export async function readReview(
  env: DeunaEnv,
  id: string,
): Promise<ReviewRecord> {
  const result = await adminRequest<{
    order: {metafield: {value: string; compareDigest: string} | null} | null;
  }>(
    env,
    `query DeunaReview($id: ID!) { order(id: $id) { metafield(namespace: "biothree", key: "deuna_review") { value compareDigest } } }`,
    {id},
  );
  const field = result.order?.metafield;
  return {
    value: field ? (JSON.parse(field.value) as Review) : null,
    digest: field?.compareDigest ?? null,
  };
}
export async function saveReview(
  env: DeunaEnv,
  id: string,
  previous: ReviewRecord,
  value: Review,
) {
  const result = await adminRequest<{
    metafieldsSet: {userErrors: {message: string}[]};
  }>(
    env,
    `mutation SaveDeunaReview($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { userErrors { message } } }`,
    {
      metafields: [
        {
          ownerId: id,
          namespace: 'biothree',
          key: 'deuna_review',
          type: 'json',
          value: JSON.stringify(value),
          compareDigest: previous.digest,
        },
      ],
    },
  );
  if (result.metafieldsSet.userErrors.length)
    throw new Response(
      'El pedido cambió. Actualiza la página antes de continuar.',
      {status: 409, headers: PRIVATE_HEADERS},
    );
}
export async function receiptObject(
  env: DeunaEnv,
  key: string,
  method: 'PUT' | 'GET' | 'DELETE',
  body?: ArrayBuffer,
  mime?: string,
) {
  if (!/^deuna\/[0-9]+\/[a-f0-9-]+$/.test(key))
    throw new Error('Invalid receipt key');
  const client = new AwsClient({
    accessKeyId: env.RECEIPTS_R2_ACCESS_KEY_ID!,
    secretAccessKey: env.RECEIPTS_R2_SECRET_ACCESS_KEY!,
    service: 's3',
    region: 'auto',
  });
  const response = await client.fetch(
    `https://${env.RECEIPTS_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${encodeURIComponent(env.RECEIPTS_R2_BUCKET!)}/${key}`,
    {
      method,
      body,
      headers: mime ? {'Content-Type': mime} : {},
      redirect: 'error',
    },
  );
  if (!response.ok) throw new Error('Private receipt storage unavailable');
  return response;
}
export async function validateReceipt(file: File) {
  if (!file.size || file.size > 5 * 1024 * 1024)
    throw new Response('Sube un archivo de hasta 5 MB.', {status: 400});
  const bytes = await file.arrayBuffer();
  const b = new Uint8Array(bytes);
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v);
  const jpg = b[0] === 255 && b[1] === 216 && b[2] === 255;
  // Image-only receipts avoid serving active PDF/HTML/SVG documents from the storefront.
  const mime = png ? 'image/png' : jpg ? 'image/jpeg' : null;
  if (!mime || file.type !== mime)
    throw new Response('Usa una imagen JPG o PNG del comprobante.', {
      status: 400,
    });
  return {bytes, mime};
}
export async function uploadReceipt(
  env: DeunaEnv,
  order: PaymentOrder,
  file: File,
) {
  if (
    !order.tags.includes(DEUNA_TAG) ||
    order.cancelledAt ||
    order.displayFinancialStatus !== 'PENDING' ||
    isOrderPaid(order)
  )
    throw new Response('Este pedido no admite comprobantes.', {status: 409});
  const previous = await readReview(env, order.id);
  if (previous.value && previous.value.status !== 'rejected')
    throw new Response('Ya recibimos tu comprobante.', {status: 409});
  const {bytes, mime} = await validateReceipt(file);
  const key = `deuna/${order.legacyResourceId}/${crypto.randomUUID()}`;
  await receiptObject(env, key, 'PUT', bytes, mime);
  try {
    await saveReview(env, order.id, previous, {
      status: 'review',
      receipt: key,
      mime,
      uploadedAt: new Date().toISOString(),
      amount: order.totalOutstanding.amount,
      currency: order.totalOutstanding.currencyCode,
    });
  } catch (error) {
    await receiptObject(env, key, 'DELETE').catch(() => undefined);
    throw error;
  }
}
export async function confirmationEmail(
  env: DeunaEnv,
  order: PaymentOrder,
  state: Review,
) {
  if (!order.email) throw new Error('Order email missing');
  const approved = state.status === 'approved';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `deuna-${order.legacyResourceId}-${state.reviewedAt}-${state.status}`,
    },
    body: JSON.stringify({
      from: env.PAYMENT_EMAIL_FROM,
      to: [order.email],
      subject: approved
        ? `Pago confirmado · BIO-THREE ${order.name}`
        : `Revisa tu comprobante · BIO-THREE ${order.name}`,
      text: approved
        ? `Confirmamos el pago Deuna de tu pedido ${order.name}. Gracias por tu compra. Puedes consultar su estado en https://biothree.ec/mi-pedido con tu número de pedido y correo.`
        : `No pudimos confirmar el pago de tu pedido ${order.name}. ${state.reason}\nPuedes revisar el estado y enviar otro comprobante en https://biothree.ec/mi-pedido. No realices otro pago sin revisar primero el movimiento en Deuna.`,
    }),
  });
  if (!response.ok) throw new Error('Confirmation email not accepted');
}
export async function reviewPayment(
  env: DeunaEnv,
  id: string,
  decision: 'approve' | 'reject' | 'retry-email',
  reason: string,
  expectedDigest: string,
) {
  const order = await getOrder(env, orderGid(id));
  if (!order || !order.tags.includes(DEUNA_TAG) || order.cancelledAt)
    throw new Response('Pedido no disponible', {status: 409});
  let record = await readReview(env, order.id);
  if (!record.value || record.digest !== expectedDigest)
    throw new Response('Actualiza el pedido antes de continuar.', {
      status: 409,
    });
  if (decision === 'reject') {
    if (record.value.status !== 'review' || isOrderPaid(order))
      throw new Response('No se puede rechazar este pago.', {status: 409});
    if (reason.trim().length < 5 || reason.length > 500)
      throw new Response('Indica el motivo (5–500 caracteres).', {status: 400});
    await saveReview(env, order.id, record, {
      ...record.value,
      status: 'rejected',
      reason: reason.trim(),
      reviewedAt: new Date().toISOString(),
    });
  } else if (decision === 'approve') {
    if (!['review', 'approving'].includes(record.value.status))
      throw new Response('Este comprobante ya fue revisado.', {status: 409});
    if (
      !isOrderPaid(order) &&
      (order.displayFinancialStatus !== 'PENDING' ||
        order.totalOutstanding.amount !== record.value.amount ||
        order.totalOutstanding.currencyCode !== record.value.currency)
    )
      throw new Response('El importe del pedido cambió. Revísalo en Shopify.', {
        status: 409,
      });
    // Durable claim prevents another reviewer/retry from rejecting or replacing this receipt.
    await saveReview(env, order.id, record, {
      ...record.value,
      status: 'approving',
      reviewedAt: record.value.reviewedAt ?? new Date().toISOString(),
    });
    if (!isOrderPaid(order)) await markOrderPaid(env, order.id);
    const confirmed = await getOrder(env, order.id);
    if (!confirmed || !isOrderPaid(confirmed))
      throw new Error('Payment not confirmed by Shopify');
    record = await readReview(env, order.id);
    await saveReview(env, order.id, record, {
      ...record.value!,
      status: 'approved',
    });
  }
  record = await readReview(env, order.id);
  if (!record.value || !['approved', 'rejected'].includes(record.value.status))
    throw new Response('La revisión aún no termina.', {status: 409});
  if (!record.value.emailSentAt) {
    try {
      await confirmationEmail(env, order, record.value);
      await saveReview(env, order.id, record, {
        ...record.value,
        emailSentAt: new Date().toISOString(),
      });
    } catch {
      return {emailPending: true};
    }
  }
  return {emailPending: false};
}
export async function findCustomerOrder(
  env: DeunaEnv,
  name: string,
  email: string,
) {
  const clean = name.trim().replace(/^#/, '');
  if (!/^\d{1,12}$/.test(clean) || email.length > 254 || !email.includes('@'))
    return null;
  const result = await adminRequest<{
    orders: {nodes: {id: string; name: string; email: string | null}[]};
  }>(
    env,
    `query FindCustomerOrder($query: String!) { orders(first: 10, query: $query) { nodes { id name email } } }`,
    {query: `name:#${clean}`},
  );
  const match = result.orders.nodes.find(
    (x) =>
      x.name.replace(/^#/, '') === clean &&
      x.email?.toLowerCase() === email.trim().toLowerCase(),
  );
  return match ? getOrder(env, match.id) : null;
}

/** Limit the actual streamed body, not just an optional Content-Length header. */
export async function limitedForm(request: Request, limit = 6 * 1024 * 1024) {
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (!reader) throw new Response('Formulario vacío', {status: 400});
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new Response('Archivo demasiado grande', {status: 413});
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Response(body, {
    headers: {'Content-Type': request.headers.get('Content-Type') ?? ''},
  }).formData();
}
export async function verifyChallenge(
  request: Request,
  env: DeunaEnv,
  form: FormData,
  action: string,
) {
  const token = String(form.get('cf-turnstile-response') ?? '');
  if (!env.PAYMENT_TURNSTILE_SECRET || !token || token.length > 2048)
    return false;
  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          secret: env.PAYMENT_TURNSTILE_SECRET,
          response: token,
        }),
      },
    );
    const result = (await response.json()) as {
      success: boolean;
      action?: string;
      hostname?: string;
    };
    return (
      response.ok &&
      result.success &&
      result.action === action &&
      result.hostname === new URL(request.url).hostname
    );
  } catch {
    return false;
  }
}
