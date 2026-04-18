import { defineConfig } from 'vite'
import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import dts from 'vite-plugin-dts'
import { buildAutoImports, autoImportDtsPlugin } from '../../scanExports.js'

const src = path.resolve(import.meta.dirname, 'src')

const pkgs = {
  '~editor-server': [
    src,
    `${src}/sdk`,
  ],
}
const dtsPath = path.resolve(import.meta.dirname, 'auto-imports.d.ts')

export default defineConfig({
  resolve: {
    alias: {
      '~editor-server': src,
    },
  },
  plugins: [
    AutoImport({
      imports: buildAutoImports(pkgs, src),
      dts: false,
    }) as any,
    autoImportDtsPlugin(pkgs, src, dtsPath, { typeReExports: false }),
    dts(),
  ],
  build: {
    lib: {
      entry: {
        'sdk/index': path.resolve(src, 'sdk/index.ts'),
      },
      formats: ['es'],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    rollupOptions: { external: [/^node:/, /^ws/] },
  },
})
