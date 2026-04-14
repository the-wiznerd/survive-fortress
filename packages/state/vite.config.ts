import { defineConfig } from 'vite'
import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import dts from 'vite-plugin-dts'
import { buildAutoImports } from '../../scanExports.js'

const stateSrc = path.resolve(import.meta.dirname, 'src')

export default defineConfig({
  resolve: {
    alias: {
      '~state': stateSrc,
    },
  },
  plugins: [
    AutoImport({
      imports: buildAutoImports({
        '~state': [stateSrc],
      }, stateSrc),
      dts: path.resolve(import.meta.dirname, 'auto-imports.d.ts'),
    }) as any,
    dts({ rollupTypes: true }),
  ],
  build: {
    lib: { entry: path.resolve(stateSrc, 'index.ts'), formats: ['es'], fileName: 'index' },
  },
})
