import { defineConfig } from 'vite'
import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import dts from 'vite-plugin-dts'
import { buildAutoImports, autoImportDtsPlugin } from '../../scanExports.js'

const stateSrc = path.resolve(import.meta.dirname, 'src')

const pkgs = { '~state': [stateSrc] }
const dtsPath = path.resolve(import.meta.dirname, 'auto-imports.d.ts')

export default defineConfig({
  resolve: {
    alias: {
      '~state': stateSrc,
    },
  },
  plugins: [
    AutoImport({
      imports: buildAutoImports(pkgs, stateSrc),
      dts: false,
    }) as any,
    autoImportDtsPlugin(pkgs, stateSrc, dtsPath, { typeReExports: false }),
    dts({ rollupTypes: true }),
  ],
  build: {
    lib: { entry: path.resolve(stateSrc, 'index.ts'), formats: ['es'], fileName: 'index' },
  },
})
