import { defineConfig } from 'vite'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import { coreImports } from '../../vitest.config'

export default defineConfig({
  resolve: {
    alias: {
      '@sf/core': path.resolve(__dirname, '../core/src'),
    },
  },
  plugins: [
    AutoImport({
      imports: Object.entries(coreImports).map(([from, names]) => ({ [from]: names })),
      dts: path.resolve(__dirname, 'src/auto-imports.d.ts'),
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
