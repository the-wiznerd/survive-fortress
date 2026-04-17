import { defineConfig } from 'vite'
import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { buildAutoImports, autoImportDtsPlugin } from '../../scanExports.js'

const editorSrc = path.resolve(import.meta.dirname, 'src')

const pkgs = {
  '~editor': [
    editorSrc,
  ],
}
const dtsPath = path.resolve(import.meta.dirname, 'auto-imports.d.ts')

export default defineConfig({
  resolve: {
    alias: {
      '~editor': editorSrc,
    },
  },
  plugins: [
    vue(),
    AutoImport({
      imports: buildAutoImports(pkgs, editorSrc),
      dts: false,
    }) as any,
    autoImportDtsPlugin(pkgs, editorSrc, dtsPath),
  ],
  publicDir: path.resolve(import.meta.dirname, '../client/public'),
  server: {
    port: 5174,
    open: false,
  },
})
