# Website measurement

Configured 2026-10-28 for the existing Hydrogen storefront and custom PayPhone checkout.

## Destinations

- GA4 account: BIO-THREE Ecuador (413904777), owner account gerencia@biostradeglobal.com.
- GA4 property: BIO-THREE Ecuador | biothree.ec (561332232); USD, Ecuador time zone.
- Web stream: 16225287229; measurement ID G-R1SHYQ4PGG.
- Meta dataset/pixel: BIO-THREE Ecuador | biothree.ec (4647772138884151).
- Meta business: 1284851463418656; ad account: 1303942351822962.

Do not add a second GTM, Shopify app pixel, or theme tag for these destinations without removing the equivalent events here: duplicate integrations can double-count conversions. This checkout uses PayPhone outside Shopify's standard hosted checkout.

## Behavior

Visitors separately opt into analytics and marketing. Optional scripts run only on biothree.ec/www.biothree.ec, never on local or deployment previews. Choices expire after 180 days and can be changed through the footer. Revocation reloads the page to remove scripts/listeners.

GA4 receives manual page_view, view_item, add_to_cart, begin_checkout and purchase. Enhanced measurement, Google Signals and ad personalization are disabled. Meta receives PageView, ViewContent, AddToCart, InitiateCheckout and Purchase on allowed commerce pages. Automatic advanced matching and automatic events are disabled.

No email, phone, address, identification number, product name or health-condition parameter is included in event payloads. GA4 URLs remove private query values and exclude account/search/payment-reference routes. Meta is not invoked on educational articles, private routes or URLs with unexpected query parameters.

A purchase requires a signed checkout session, verified PayPhone payment, and a second Shopify Admin API read showing PAID. The browser returns to /pago/confirmado, without order or payment IDs in the URL. The server returns only allowlisted monetary and item fields. GA4 value excludes tax and shipping; Meta value includes the order total. Transaction/event ID is biothree-<Shopify order ID>. Local browser storage suppresses repeat purchase sends per destination; GA4 also receives a transaction_id.

## Verification and limits

126 tests, type checking, linting and production build pass. The Admin query has also been accepted by the actual store API using a nonexistent order ID (no customer data read or modified). Local UI checks verified rejection and separate consent choices persist across reload.

These checks do not prove real purchase receipt. After deployment, complete a legitimate test checkout with both consents enabled, then compare its transaction ID, currency, item quantity, value, shipping and tax in GA4 and Meta. Reload the receipt and verify no second purchase. Also check rejected/cancelled payment does not create purchase and inspect Meta Diagnostics.

Meta classifies the dataset as Health & wellness provider, with core setup restrictions. Actual Purchase eligibility/receipt remains to be verified; do not change category or disguise events to evade restrictions. No Conversions API is configured. Browser blocking, revoked consent, storage clearing or leaving before the receipt loads can cause missing events; browser queued sends are not delivery acknowledgments. Manual payment links or another browser without the original checkout session intentionally cannot expose order data to this receipt route.
