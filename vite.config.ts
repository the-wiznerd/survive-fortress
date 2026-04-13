import { defineConfig } from 'vitest/config'
import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import { scanExports } from './scanExports'

const coreSrc = path.resolve(import.meta.dirname, 'src/core')
const uiSrc = path.resolve(import.meta.dirname, 'src/ui')

const rawImports = scanExports([
  coreSrc,
  `${coreSrc}/traits`,
  `${coreSrc}/systems`,
  `${coreSrc}/entityTypes`,
  `${uiSrc}/rendering`,
  `${uiSrc}/rendering/entities`,
], import.meta.dirname)

// Rewrite ./src/core/... → @core/... and ./src/ui/... → @ui/... so imports resolve via alias
const aliasedImports = Object.fromEntries(
  Object.entries(rawImports).map(([k, v]) => [
    k.replace('./src/core', '@core').replace('./src/ui', '@ui'),
    v,
  ])
)

export default defineConfig({
  resolve: {
    alias: {
      '@core': coreSrc,
      '@ui': uiSrc,
    },
  },
  plugins: [
    AutoImport({
      imports: [aliasedImports],
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
