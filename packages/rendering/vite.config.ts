import { defineConfig } from 'vite'
import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import dts from 'vite-plugin-dts'
import { buildAutoImports, autoImportDtsPlugin } from '../../scanExports.js'

const src = path.resolve(import.meta.dirname, 'src')

const pkgs = {
  '~rendering': [
    src,
    `${src}/entities`,
  ],
}
const dtsPath = path.resolve(import.meta.dirname, 'auto-imports.d.ts')

export default defineConfig({
  resolve: {
    alias: {
      '~rendering': src,
    },
  },
  plugins: [
    AutoImport({
      imports: buildAutoImports(pkgs, src),
      dts: false,
    }) as any,
    autoImportDtsPlugin(pkgs, src, dtsPath, { typeReExports: false }),
    dts({ rollupTypes: true }),
  ],
  build: {
    lib: { entry: path.resolve(src, 'index.ts'), formats: ['es'], fileName: 'index' },
  },
})
