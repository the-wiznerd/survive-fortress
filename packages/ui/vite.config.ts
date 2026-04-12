import { defineConfig } from 'vite'
import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import { scanExports } from '../../scanExports'

const coreSrc = path.resolve(import.meta.dirname, '../core/src')
const rootDir = path.resolve(import.meta.dirname, '../..')

const coreImports = scanExports([
  coreSrc,
  `${coreSrc}/traits`,
  `${coreSrc}/systems`,
  `${coreSrc}/entityTypes`,
], rootDir)

export default defineConfig({
  resolve: {
    alias: {
      '@sf/core': coreSrc,
    },
  },
  plugins: [
    AutoImport({
      imports: [coreImports],
      dts: false,
    }),
  ],
  server: {
    port: 5173,
    open: false,
  },
})
