/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

declare global {
  interface Env {
    /** Preview-only: see `resolveTarget` in `~/lib/biothree.ts` and `.env.mock`. */
    PREVIEW_PRODUCT_HANDLE?: string;
    PREVIEW_OPTION_NAME?: string;
    PREVIEW_OPTION_VALUES?: string;

    /**
     * PayPhone payment-link automation. All private (no PUBLIC_ prefix); set
     * them in the Hydrogen storefront's environment variables on Oxygen. See
     * docs/payphone-automation.md.
     */
    SHOPIFY_CLIENT_ID?: string;
    SHOPIFY_CLIENT_SECRET?: string;
    /** Legacy alternative to client id/secret. */
    SHOPIFY_ADMIN_API_TOKEN?: string;
    /** Only needed when the webhook is created in the admin instead of by the app. */
    SHOPIFY_WEBHOOK_SECRET?: string;
    PAYPHONE_API_TOKEN?: string;
    PAYPHONE_STORE_ID?: string;
    PAYPHONE_LINK_EXPIRE_HOURS?: string;
    PAYPHONE_WEBHOOK_KEY?: string;
    PAYPHONE_RECONCILE_SECRET?: string;
  }
}
