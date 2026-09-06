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
  }
}
