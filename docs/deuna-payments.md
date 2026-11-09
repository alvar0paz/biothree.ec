# Deuna manual payments — November 9, 2026

Owner-approved flow: private review dashboard at deuna.biothree.ec, same Shopify orders as biothree.ec. Payment approval marks paid / ready to prepare; never fulfills or ships the order.

## Confirmation emails — current decision

The owner chose the existing Google mailbox **info@biostradeglobal.com**. No Resend account or automatic sending service is required. After approval/rejection, an authenticated owner can open a prefilled Gmail compose link, review the sender/recipient/text and click Send in Gmail. Opening the draft does not send mail or mark it sent. A separate checkbox and “Registrar correo enviado” action records the owner's attestation, with emailMethod=manual-gmail. Delivery is not automatically verified. The dashboard does not have access to the Google mailbox.

## Privacy and operation

- Customer lookup: order number + purchase email + Turnstile, signed 30-minute session. Existing Shopify order access window applies (normally 60 days).
- Receipt upload: JPG/PNG, 5 MB, validated signatures; private R2 storage. No public receipt URLs.
- Admin: distinct generated secret, one-hour Secure/HttpOnly/SameSite=Strict host-only cookie, Turnstile, same-origin POST checks. Rotation invalidates sessions.
- Review state uses compareDigest concurrency checks on biothree.deuna_review. Durable approving state allows interrupted approval recovery. Amount/currency, cancelled status and actual Shopify payment status are checked.
- Owner must verify the real incoming Deuna movement; the receipt alone is not proof. Rejection allows another receipt. No real payments have been approved in setup.
- Deuna orders are tagged at creation; PayPhone webhooks and retry routes cannot process them.
- Review portal has a separate shell without storefront measurement. Receipt and order responses are private/no-store. Deuna hostname rejects storefront routes.

## Infrastructure

Cloudflare account f189d3d21f3925056a4b53975cca202f:
- R2 biothree-payment-receipts, Standard, public access disabled.
- Explicitly authorized Object Read & Write credential limited to this bucket. Synthetic live write/read verified, anonymous access denied; test object removed.
- Turnstile BIO-THREE payments, Managed, biothree.ec + deuna.biothree.ec, no pre-clearance.
- $0.01 account-wide usage email alert; not a spending cap. Default $10 retained.

Shopify:
- Existing Hydrogen storefront biothree.ec, xzey91-tr.myshopify.com.
- Order JSON metafield definition gid://shopify/MetafieldDefinition/594436489370, namespace biothree / key deuna_review. Storefront and customer-account access NONE. No order values written during setup.
- Deuna domain ID 145299374234. Change redirect to Alias only after protected deployment is ready; keep main domain primary.

Required private runtime variables: RECEIPTS_R2_ACCOUNT_ID, RECEIPTS_R2_BUCKET, RECEIPTS_R2_ACCESS_KEY_ID, RECEIPTS_R2_SECRET_ACCESS_KEY, PAYMENT_TURNSTILE_SITE_KEY, PAYMENT_TURNSTILE_SECRET, PAYMENT_ADMIN_SECRET (32+ characters), PAYMENT_CONFIRMATION_EMAIL, SESSION_SECRET, existing Shopify admin credentials. DEUNA_ENABLED=true enables the flow. Never commit secret values.

## Validation and remaining live checks

148 tests and TypeScript passed after merging current origin/main, including newer PayPhone/measurement changes. Production build passed. Shopify skill component validator is unavailable due missing bundled TypeScript dependency; connector validated the metafield mutation before execution.

Before final handoff verify protected routes, domain, QR asset, customer lookup and Gmail draft behavior. No real customer email, payment approval or fulfillment should be performed as a test. QR merchant is BIOSTRADE GLOBAL CIA. LTDA.; owner must confirm it in the Deuna app. No automatic receipt deletion policy has been configured.

Deployment and live evidence are maintained in ../../output/deuna-integration-2026-11-09/status.json.
