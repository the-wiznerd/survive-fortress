import { defineConfig } from 'vitest/config'
import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import { scanExports } from './scanExports'

const coreSrc = path.resolve(import.meta.dirname, 'packages/core/src')

const coreImports = scanExports([
  coreSrc,
  `${coreSrc}/traits`,
  `${coreSrc}/systems`,
  `${coreSrc}/entityTypes`,
], import.meta.dirname)

export default defineConfig({
  resolve: {
    alias: {
      '@sf/core': coreSrc,
    },
  },
  plugins: [
    AutoImport({
      imports: [coreImports],
      dts: path.resolve(import.meta.dirname, 'auto-imports.d.ts'),
    }) as any,
  ],
  test: {
    include: ['packages/*/tests/**/*.test.ts'],
  },
})
