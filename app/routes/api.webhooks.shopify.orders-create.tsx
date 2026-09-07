// Shopify → us. The subscription is created by `scripts/shopify-webhook.mjs`
// (app-owned, signed with the app's client secret) and points at
// https://<store domain>/api/webhooks/shopify/orders-create.
//
// Shopify retries on any non-2xx, so we answer 200 for everything we chose to
// skip and let real failures bubble up as 500 to get a retry.

import type {Route} from './+types/api.webhooks.shopify.orders-create';
import {verifyShopifyWebhookHmac} from '~/lib/shopify-webhook';
import {
  getFlowEnv,
  getWebhookSecret,
  handleOrderCreated,
  type OrderCreatedPayload,
} from '~/lib/payphone-flow';

export async function loader() {
  return Response.json({error: 'Method not allowed'}, {status: 405});
}

export async function action({request, context}: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }

  const env = context.env;
  const flowEnv = getFlowEnv(env);
  const webhookSecret = getWebhookSecret(env);
  if (!flowEnv || !webhookSecret) {
    return Response.json({error: 'PayPhone automation not configured'}, {status: 503});
  }

  const rawBody = await request.text();
  const valid = await verifyShopifyWebhookHmac(
    rawBody,
    request.headers.get('X-Shopify-Hmac-Sha256'),
    webhookSecret,
  );
  if (!valid) return Response.json({error: 'Invalid signature'}, {status: 401});

  const topic = request.headers.get('X-Shopify-Topic');
  if (topic && topic !== 'orders/create') {
    return Response.json({status: 'skipped', reason: `topic ${topic}`});
  }

  let payload: OrderCreatedPayload;
  try {
    payload = JSON.parse(rawBody) as OrderCreatedPayload;
  } catch {
    return Response.json({error: 'Invalid JSON'}, {status: 400});
  }

  try {
    const result = await handleOrderCreated(payload, flowEnv);
    // Don't echo the link back to Shopify's webhook log.
    const {link: _link, ...safe} = result as typeof result & {link?: string};
    return Response.json(safe);
  } catch (error) {
    console.error('orders/create webhook failed:', error);
    return Response.json({error: 'Processing failed'}, {status: 500});
  }
}
