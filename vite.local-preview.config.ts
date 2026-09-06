// Local preview only — not used by `npm run build`, `npm run dev`, or deploys.
//
// `shopify hydrogen dev` requires a Shopify login before it will start, because
// it fetches env vars from the linked storefront. This config runs the same
// Vite + Oxygen stack but feeds the worker the vars from `.env` directly, so
// the site can be viewed without logging in.
//
// Usage: npx vite --config vite.local-preview.config.ts
//
// With placeholder Storefront credentials the product queries fail by design,
// so the cards render their Instagram fallback. For real prices, stock and
// add-to-cart, use `npx shopify hydrogen dev` instead.
import {defineConfig, loadEnv} from 'vite';
import {hydrogen} from '@shopify/hydrogen/vite';
import {oxygen} from '@shopify/mini-oxygen/vite';
import {reactRouter} from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({mode}) => {
  // '' prefix loads every var in .env, not just VITE_-prefixed ones.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      tailwindcss(),
      hydrogen(),
      oxygen({env}),
      reactRouter(),
      tsconfigPaths(),
    ],
    build: {
      assetsInlineLimit: 0,
    },
    ssr: {
      optimizeDeps: {
        include: ['set-cookie-parser', 'cookie', 'react-router'],
      },
    },
  };
});
