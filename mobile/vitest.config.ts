import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Pure logic only (reducer, mapper, validation, persistence) — no React
    // Native rendering — so a plain Node environment is enough.
    environment: 'node',
    include: ['src/**/*.test.ts'],
    reporters: process.env.CI ? ['default', 'junit'] : ['default'],
    outputFile: { junit: './test-results/junit.xml' },
  },
  resolve: {
    alias: {
      // Same shared enrichment contract the app imports via tsconfig paths.
      '@shared': fileURLToPath(
        new URL('../backend/src/enrichment', import.meta.url)
      ),
    },
  },
});
