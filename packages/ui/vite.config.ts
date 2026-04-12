import { defineConfig } from 'vite'
import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import { coreImports } from '../../vitest.config'

export default defineConfig({
  resolve: {
    alias: {
      '@sf/core': path.resolve(import.meta.dirname, '../core/src'),
    },
  },
  plugins: [
    AutoImport({
      imports: Object.entries(coreImports).map(([from, names]) => ({ [from]: names })),
      dts: path.resolve(import.meta.dirname, 'src/auto-imports.d.ts'),
    }),
  ],
  optimizeDeps: {
    exclude: Object.keys(coreImports),
  },
  server: {
    port: 5173,
    open: false,
  },
})
