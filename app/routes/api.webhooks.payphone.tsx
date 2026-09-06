// PayPhone → us ("Notificación Externa"). PayPhone POSTs a JSON body with
// TransactionId / ClientTransactionId for approved transactions and expects
// {"Response": true, "ErrorCode": "000"} back.
//
// PayPhone doesn't sign these, so the body is treated as a hint only: the
// flow re-reads the transaction from PayPhone's API with our token before
// touching the order. Set PAYPHONE_WEBHOOK_KEY and register the URL as
// https://<domain>/api/webhooks/payphone?key=<that value> to keep strangers
// from even triggering lookups.

import type {Route} from './+types/api.webhooks.payphone';
import {timingSafeEqual} from '~/lib/shopify-webhook';
import {getFlowEnv, settleTransaction} from '~/lib/payphone-flow';

type Notification = {
  TransactionId?: number | string;
  transactionId?: number | string;
  ClientTransactionId?: string;
  clientTransactionId?: string;
};

const ok = () => Response.json({Response: true, ErrorCode: '000'});
const fail = (code: string, status = 200) =>
  Response.json({Response: false, ErrorCode: code}, {status});

export async function loader() {
  return Response.json({error: 'Method not allowed'}, {status: 405});
}

export async function action({request, context}: Route.ActionArgs) {
  if (request.method !== 'POST') return fail('111', 405);

  const env = context.env;
  const flowEnv = getFlowEnv(env);
  if (!flowEnv) return fail('111', 503);

  if (env.PAYPHONE_WEBHOOK_KEY) {
    const key = new URL(request.url).searchParams.get('key') ?? '';
    if (!timingSafeEqual(key, env.PAYPHONE_WEBHOOK_KEY)) return fail('111', 401);
  }

  let body: Notification;
  try {
    body = (await request.json()) as Notification;
  } catch {
    return fail('111', 400);
  }

  const transactionId = body.TransactionId ?? body.transactionId ?? null;
  const clientTransactionId = body.ClientTransactionId ?? body.clientTransactionId ?? null;
  if (transactionId == null && !clientTransactionId) return fail('111', 400);

  try {
    const result = await settleTransaction({transactionId, clientTransactionId}, flowEnv);
    if (result.status === 'skipped') {
      console.warn('PayPhone notification skipped:', result);
    }
    // Every handled outcome is acknowledged; a retry would reach the same
    // conclusion, so there is nothing to gain from asking PayPhone to resend.
    return ok();
  } catch (error) {
    console.error('PayPhone notification failed:', error);
    return fail('111', 500);
  }
}
