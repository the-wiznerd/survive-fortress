import { defineConfig } from 'vitest/config'
import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import { buildAutoImports } from '../../scanExports.js'

const stateSrc = path.resolve(import.meta.dirname, '../state/src')
const uiSrc = path.resolve(import.meta.dirname, 'src')

export default defineConfig({
  resolve: {
    alias: {
      '~ui': uiSrc,
    },
  },
  plugins: [
    AutoImport({
      imports: buildAutoImports({
        '@sf/state': [stateSrc],
        '~ui': [
          uiSrc,
          `${uiSrc}/rendering`,
          `${uiSrc}/rendering/entities`,
          `${uiSrc}/rendering/traits`,
        ],
      }, uiSrc),
      dts: path.resolve(import.meta.dirname, 'auto-imports.d.ts'),
    }) as any,
  ],
  build: {
    lib: { entry: path.resolve(uiSrc, 'index.ts'), formats: ['es'] },
    rollupOptions: { external: [/^@sf\//] },
  },
})
