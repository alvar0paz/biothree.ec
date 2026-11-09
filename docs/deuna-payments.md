# Deuna manual payments — implementation draft, 2026-11-09

Branch: `codex/deuna-payment-review`. Not deployed. `DEUNA_ENABLED` must stay unset/false until the acceptance checks below pass. Owner requested a separate admin page accessible only to them; no team access.

## Customer and owner flow

- Checkout offers PayPhone and, when fully configured, Deuna.
- Deuna orders are created pending in Shopify with `deuna-checkout` from birth. PayPhone webhooks and retry routes cannot turn these into PayPhone payment attempts.
- `/mi-pedido`: order number + purchase email + Turnstile check. Shows payment and dispatch status for either method; signed, short-lived order access. No customer address or receipt is returned to lookup users.
- Deuna: display original merchant QR and exact outstanding amount; JPG/PNG receipt up to 5 MB. Store privately in R2. Receipt submission only changes review state, never financial status.
- `/admin/pagos`: owner-only secret, Turnstile, Secure/HttpOnly one-hour cookie; receipt images served through the authenticated endpoint. No public R2 URLs.
- Owner checks actual incoming Deuna movement, then confirms or requests another receipt. Approval marks Shopify order paid. A separate Resend confirmation follows. A failed email leaves payment approved and exposes an email-only retry action.
- Compare-and-set review updates prevent stale review decisions. `approving` state makes an interrupted Shopify approval recoverable. Refuse changed amounts, cancelled orders and non-pending uploads. Rejected receipt images remain in private storage for audit; choose a retention policy before launch.

## Required setup (not performed)

1. Cloudflare R2 private bucket, e.g. `biothree-payment-receipts`. Disable public access; no custom public domain. R2 subscription/payment details may be required even with free-tier usage. No paid service or billing enrollment authorized in this task.
2. Bucket-scoped Object Read & Write S3 credentials. Set Oxygen private variables:
   - `RECEIPTS_R2_ACCOUNT_ID`
   - `RECEIPTS_R2_BUCKET`
   - `RECEIPTS_R2_ACCESS_KEY_ID`
   - `RECEIPTS_R2_SECRET_ACCESS_KEY`
3. Cloudflare Turnstile widget restricted to biothree.ec and staging hostname. `PAYMENT_TURNSTILE_SITE_KEY`, private `PAYMENT_TURNSTILE_SECRET`. Server checks token, hostname and action; no bypass when unconfigured. Needed for lookup even if Deuna itself is disabled.
4. Resend account and verified sending domain. Add only the required sender-verification DNS records in Shopify; preserve existing inbox MX records. Set private `RESEND_API_KEY` (sending only) and `PAYMENT_EMAIL_FROM`, e.g. `BIO-THREE <pedidos@biothree.ec>` once verified. No account created or live emails sent.
5. Generate a random owner-only `PAYMENT_ADMIN_SECRET` with at least 32 characters, delivered via a password manager. Do not reuse the campaign portal password. Existing `SESSION_SECRET` signs cookies. No credential in git, docs or logs.
6. Define merchant-owned Shopify order metafield `biothree.deuna_review`, JSON, with no Storefront/customer access. This integration uses the existing merchant credentials and namespace alongside the existing PayPhone integration rather than installing a new CLI-managed app. Definition creation is in `scripts/deuna-review-definition.graphql`; execute once through the existing app credentials and check errors before writing values. Shopify needs read_orders/write_orders/write_draft_orders, already used by checkout.
7. Set `DEUNA_ENABLED=true` only in staging first. All secrets remain server-side. Do not enable in production until the checks below pass.

## Acceptance and operational checks still required

- In staging, place an authorized test order through each payment option; check exact total, shipping, cart clearing and Shopify notifications. Existing Shopify draft completion can send an order-created notification; ensure it does not describe pending Deuna as paid.
- Scan supplied QR with Deuna and confirm merchant display matches BIOSTRADE GLOBAL CIA. LTDA. Original PDF copied byte-for-byte; PNG is a rendered preview. No fabricated QR or bank details.
- Upload JPG/PNG from mobile; check private object retrieval, oversized/unsupported rejection, expired sessions, reload/retry and concurrent submissions. Confirm all protected response headers and Turnstile under production CSP.
- Approve/reject against a sandbox/mock payment. Never use an invented receipt to approve a real order. Test rejected resubmission, interrupted approval recovery, failed email/retry and sender delivery.
- Confirm order number format against the store (currently accepts numeric Shopify order names with optional `#`). Customer order lookup currently covers Admin API order-access window; older-than-60-day access requires read_all_orders and explicit approval.
- Confirm receipt retention and cleanup period with owner. No automatic deletion policy chosen. For email retries more than 24 hours after review, check the Resend delivery log first: provider idempotency keys expire after 24 hours.
- Verify R2 usage limits/billing, delivery sender, owner login handoff, mobile UI and Shopify API compatibility before activation.

## Verification performed

Local TypeScript, targeted lint, full Vitest suite and production build. Browser review of lookup page against existing catalog configuration. Unit tests use mocked Shopify/R2/email boundaries; no live order/payment/email was created or changed.
Shopify skill's exact-version Admin docs/validator no longer list pinned 2025-07; Hydrogen component validator also lacks bundled types index. This is a remaining external validation limitation, not evidence of successful Shopify schema validation. Existing API pin is unchanged; review its effective supported version before production activation.

References: https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsSet (CAS available since 2024-07); https://developers.cloudflare.com/r2/api/s3/api/ ; https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ ; https://resend.com/docs/dashboard/emails/idempotency-keys .
