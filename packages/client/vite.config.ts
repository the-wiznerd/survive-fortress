import { defineConfig } from 'vite'
import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import { buildAutoImports } from '../../scanExports.js'

const stateSrc = path.resolve(import.meta.dirname, '../state/src')
const engineSrc = path.resolve(import.meta.dirname, '../engine/src')

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
      dts: false,
    }) as any,
  ],
  publicDir: path.resolve(import.meta.dirname, 'public'),
  server: {
    port: 5173,
    open: false,
  },
})
