import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@sf/core': path.resolve(__dirname, '../core/src'),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
