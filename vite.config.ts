import { defineConfig } from 'vitest/config'
import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import { scanExports } from './scanExports'

const coreSrc = path.resolve(import.meta.dirname, 'src/core')

const rawImports = scanExports([
  coreSrc,
  `${coreSrc}/traits`,
  `${coreSrc}/systems`,
  `${coreSrc}/entityTypes`,
], import.meta.dirname)

// Rewrite ./src/core/... → @core/... so imports resolve via alias from any file depth
const coreImports = Object.fromEntries(
  Object.entries(rawImports).map(([k, v]) => [k.replace('./src/core', '@core'), v])
)

export default defineConfig({
  resolve: {
    alias: {
      '@core': coreSrc,
    },
  },
  plugins: [
    AutoImport({
      imports: [coreImports],
      dts: path.resolve(import.meta.dirname, 'auto-imports.d.ts'),
    }) as any,
  ],
  server: {
    port: 5173,
    open: false,
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
