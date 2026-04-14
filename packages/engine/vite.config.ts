import { defineConfig } from 'vitest/config'
import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import dts from 'vite-plugin-dts'
import { buildAutoImports } from '../../scanExports.js'

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
        '~engine': [
          engineSrc,
          `${engineSrc}/systems`,
          `${engineSrc}/traits`,
          `${engineSrc}/entityTypes`,
        ],
      }, engineSrc),
      dts: path.resolve(import.meta.dirname, 'auto-imports.d.ts'),
    }) as any,
    dts({ rollupTypes: true }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
  },
  build: {
    lib: { entry: path.resolve(engineSrc, 'index.ts'), formats: ['es'], fileName: 'index' },
    rollupOptions: { external: [/^@sf\//] },
  },
})
