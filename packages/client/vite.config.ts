import { defineConfig } from 'vitest/config'
import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import { buildAutoImports } from '../../scanExports.js'

const stateSrc = path.resolve(import.meta.dirname, '../state/src')
const engineSrc = path.resolve(import.meta.dirname, '../engine/src')
const uiSrc = path.resolve(import.meta.dirname, '../ui/src')

export default defineConfig({
  plugins: [
    AutoImport({
      imports: buildAutoImports({
        '@sf/state': [stateSrc],
        '@sf/engine': [
          engineSrc,
          `${engineSrc}/systems`,
          `${engineSrc}/traits`,
          `${engineSrc}/entityTypes`,
        ],
        '@sf/ui': [
          uiSrc,
          `${uiSrc}/rendering`,
          `${uiSrc}/rendering/entities`,
          `${uiSrc}/rendering/traits`,
        ],
      }),
      dts: path.resolve(import.meta.dirname, 'auto-imports.d.ts'),
    }) as any,
  ],
  publicDir: path.resolve(import.meta.dirname, 'public'),
  server: {
    port: 5173,
    open: false,
  },
})
