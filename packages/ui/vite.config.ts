import { defineConfig } from 'vite'
import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'

const coreSrc = path.resolve(import.meta.dirname, '../core/src')

export default defineConfig({
  resolve: {
    alias: {
      '@sf/core': coreSrc,
    },
  },
  plugins: [
    AutoImport({
      imports: [
        { '@sf/core/entityTypes/BaseEntityType': ['BaseEntityType'] },
        { '@sf/core/traits/Trait': ['Trait'] },
      ],
      dirs: [
        coreSrc,
        `${coreSrc}/traits`,
        `${coreSrc}/systems`,
        `${coreSrc}/entityTypes`,
      ],
      dirsScanOptions: { types: false },
      dts: path.resolve(import.meta.dirname, 'src/auto-imports.d.ts'),
    }),
  ],
  server: {
    port: 5173,
    open: false,
  },
})
