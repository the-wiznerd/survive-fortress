import { defineConfig } from 'vite'
import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import dts from 'vite-plugin-dts'
import { buildAutoImports, autoImportDtsPlugin } from '../../scanExports.js'

const serverSrc = path.resolve(import.meta.dirname, 'src')

const pkgs = {
  '~server': [
    serverSrc,
    `${serverSrc}/sdk`,
  ],
}
const dtsPath = path.resolve(import.meta.dirname, 'auto-imports.d.ts')

export default defineConfig({
  resolve: {
    alias: {
      '~server': serverSrc,
    },
  },
  plugins: [
    AutoImport({
      imports: buildAutoImports(pkgs, serverSrc),
      dts: false,
    }) as any,
    autoImportDtsPlugin(pkgs, serverSrc, dtsPath),
    dts(),
  ],
  build: {
    lib: {
      entry: {
        index: path.resolve(serverSrc, 'index.ts'),
        'sdk/index': path.resolve(serverSrc, 'sdk/index.ts'),
      },
      formats: ['es'],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    rollupOptions: { external: [/^@sf\//] },
  },
})
