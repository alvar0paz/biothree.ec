# Bio-Three.ec

Shopify Hydrogen storefront for Bio-Three.

## Getting started

**Requirements:**

- Node.js version 18.0.0 or higher

## Local development

```bash
corepack enable
yarn install --immutable
yarn dev
```

Use the Yarn version pinned in `package.json` and the committed `yarn.lock`,
as CI does. Avoid `npm install`, which creates a second lockfile and causes
Hydrogen's multiple-lockfile warning.

## Building for production

```bash
yarn build
```

The build generates GraphQL types using `.graphqlrc.ts`. Storefront queries
and Customer Account queries are validated against their respective schemas.
`app/lib/shopify-admin.ts` and `app/lib/shopify-checkout.ts` are separate,
manually typed Admin API clients and are excluded from Storefront codegen;
their behavior is covered by unit tests. New Admin operations should stay in
those modules unless a separate Admin schema/codegen project is configured.

## Payments

Checkout lives in the storefront (`/checkout`) and charges cards through
PayPhone's hosted payment button; see `docs/payphone-automation.md`.
