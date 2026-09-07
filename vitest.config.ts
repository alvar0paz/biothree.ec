import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  resolve: {
    // Mirrors tsconfig's `~/*` → `app/*` without the tsconfig-paths plugin,
    // whose vite typings drift from vitest's bundled vite.
    alias: {'~': fileURLToPath(new URL('./app', import.meta.url))},
  },
  test: {
    environment: 'node',
    include: ['app/**/*.test.ts'],
  },
});
