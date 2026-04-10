import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@sf/core': path.resolve(__dirname, 'packages/core/src'),
    },
  },
  test: {
    include: ['packages/*/tests/**/*.test.ts'],
  },
});
