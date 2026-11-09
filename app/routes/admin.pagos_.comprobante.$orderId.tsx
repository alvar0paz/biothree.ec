import type {Route} from './+types/admin.pagos_.comprobante.$orderId';
import {
  PRIVATE_HEADERS,
  readReview,
  receiptObject,
  requireAdmin,
} from '~/lib/deuna.server';
import {orderGid} from '~/lib/shopify-admin';
export async function loader({request, params, context}: Route.LoaderArgs) {
  await requireAdmin(request, context.env);
  if (!params.orderId || !/^\d+$/.test(params.orderId))
    throw new Response('No encontrado', {status: 404});
  const record = await readReview(context.env, orderGid(params.orderId));
  if (!record.value) throw new Response('No encontrado', {status: 404});
  const file = await receiptObject(context.env, record.value.receipt, 'GET');
  return new Response(file.body, {
    headers: {
      ...PRIVATE_HEADERS,
      'Content-Type': record.value.mime,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Content-Disposition': `inline; filename="comprobante-${params.orderId}.${record.value.mime === 'image/png' ? 'png' : 'jpg'}"`,
    },
  });
}
