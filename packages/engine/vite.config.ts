import { defineConfig } from 'vitest/config'
import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import { buildAutoImports } from '../../scanExports.js'

const stateSrc = path.resolve(import.meta.dirname, '../state/src')
const engineSrc = path.resolve(import.meta.dirname, 'src')

export default defineConfig({
  resolve: {
    alias: {
      '~engine': engineSrc,
    },
  },
  plugins: [
    AutoImport({
      imports: buildAutoImports({
        '@sf/state': [stateSrc],
        '~engine': [
          engineSrc,
          `${engineSrc}/systems`,
          `${engineSrc}/traits`,
          `${engineSrc}/entityTypes`,
        ],
      }, engineSrc),
      dts: path.resolve(import.meta.dirname, 'auto-imports.d.ts'),
    }) as any,
  ],
  test: {
    include: ['tests/**/*.test.ts'],
  },
  build: {
    lib: { entry: path.resolve(engineSrc, 'index.ts'), formats: ['es'] },
    rollupOptions: { external: [/^@sf\//] },
  },
})
