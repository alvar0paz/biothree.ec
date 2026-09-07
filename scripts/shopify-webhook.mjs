#!/usr/bin/env node
/* eslint-disable no-console -- CLI script, output is the point */
// Creates (or verifies) the app-owned `orders/create` webhook subscription
// that feeds the PayPhone automation. Idempotent: re-running lists the
// existing subscription instead of duplicating it.
//
//   node scripts/shopify-webhook.mjs            # create if missing
//   node scripts/shopify-webhook.mjs --list     # only show what exists
//   node scripts/shopify-webhook.mjs --delete   # remove ours
//
// Reads PUBLIC_STORE_DOMAIN from .env and the app credentials from
// .env.payphone (both gitignored). Requires the app to be installed on the
// store with read_orders + write_orders. SITE_ORIGIN overrides the callback
// host (defaults to https://biothree.ec).

import {readFileSync} from 'node:fs';

const API_VERSION = '2025-07';
const TOPIC = 'ORDERS_CREATE';

function loadEnv(file) {
  const out = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match) out[match[1]] = match[2];
  }
  return out;
}

const env = {...loadEnv('.env'), ...loadEnv('.env.payphone')};
const shop = env.PUBLIC_STORE_DOMAIN;
const site = process.env.SITE_ORIGIN ?? 'https://biothree.ec';
const callbackUrl = `${site}/api/webhooks/shopify/orders-create`;

if (!shop || !env.SHOPIFY_CLIENT_ID || !env.SHOPIFY_CLIENT_SECRET) {
  console.error('Need PUBLIC_STORE_DOMAIN, SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET');
  process.exit(1);
}

const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
  method: 'POST',
  headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: env.SHOPIFY_CLIENT_ID,
    client_secret: env.SHOPIFY_CLIENT_SECRET,
  }),
});
if (!tokenResponse.ok) {
  console.error(`Token exchange failed: ${tokenResponse.status} ${await tokenResponse.text()}`);
  process.exit(1);
}
const {access_token: token, scope} = await tokenResponse.json();
console.log(`Token OK. Scopes: ${scope}`);

async function gql(query, variables = {}) {
  const response = await fetch(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': token},
    body: JSON.stringify({query, variables}),
  });
  const json = await response.json();
  if (!response.ok || json.errors) {
    throw new Error(`Admin API ${response.status}: ${JSON.stringify(json.errors ?? json)}`);
  }
  return json.data;
}

const existing = await gql(`#graphql
  query { webhookSubscriptions(first: 20, topics: [${TOPIC}]) {
    nodes { id topic endpoint { __typename ... on WebhookHttpEndpoint { callbackUrl } } }
  } }
`);
const nodes = existing.webhookSubscriptions.nodes;
const ours = nodes.filter((node) => node.endpoint.callbackUrl === callbackUrl);
console.log(`Existing ${TOPIC} subscriptions for this app: ${nodes.length}`);
for (const node of nodes) console.log(`  ${node.id} → ${node.endpoint.callbackUrl}`);

if (process.argv.includes('--list')) process.exit(0);

if (process.argv.includes('--delete')) {
  for (const node of ours) {
    const result = await gql(
      `#graphql
      mutation($id: ID!) {
        webhookSubscriptionDelete(id: $id) { deletedWebhookSubscriptionId userErrors { message } }
      }`,
      {id: node.id},
    );
    console.log('Deleted', result.webhookSubscriptionDelete.deletedWebhookSubscriptionId);
  }
  process.exit(0);
}

if (ours.length) {
  console.log('Webhook already in place; nothing to do.');
  process.exit(0);
}

const created = await gql(
  `#graphql
  mutation($topic: WebhookSubscriptionTopic!, $sub: WebhookSubscriptionInput!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $sub) {
      webhookSubscription { id }
      userErrors { field message }
    }
  }`,
  {topic: TOPIC, sub: {callbackUrl, format: 'JSON'}},
);
const {webhookSubscription, userErrors} = created.webhookSubscriptionCreate;
if (userErrors.length) {
  console.error('Failed:', userErrors);
  process.exit(1);
}
console.log(`Created ${webhookSubscription.id} → ${callbackUrl}`);
/* eslint-enable no-console */
