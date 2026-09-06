// Safety net: sweeps pending orders that have a PayPhone link and marks paid
// the ones PayPhone reports as approved. Called every 15 minutes by the
// `payphone-reconcile` GitHub Actions workflow with
// `Authorization: Bearer $PAYPHONE_RECONCILE_SECRET`. Harmless to call by
// hand when a customer says they paid and the order still shows pending.

import type {Route} from './+types/api.payphone.reconcile';
import {timingSafeEqual} from '~/lib/shopify-webhook';
import {getFlowEnv, reconcilePendingOrders} from '~/lib/payphone-flow';

export async function loader() {
  return Response.json({error: 'Method not allowed'}, {status: 405});
}

export async function action({request, context}: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }

  const env = context.env;
  const flowEnv = getFlowEnv(env);
  if (!flowEnv || !env.PAYPHONE_RECONCILE_SECRET) {
    return Response.json({error: 'PayPhone automation not configured'}, {status: 503});
  }

  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : '';
  if (!timingSafeEqual(token, env.PAYPHONE_RECONCILE_SECRET)) {
    return Response.json({error: 'Unauthorized'}, {status: 401});
  }

  try {
    const result = await reconcilePendingOrders(flowEnv);
    return Response.json(result);
  } catch (error) {
    console.error('PayPhone reconcile failed:', error);
    return Response.json({error: 'Reconcile failed'}, {status: 500});
  }
}
