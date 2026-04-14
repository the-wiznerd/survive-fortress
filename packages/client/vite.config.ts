import { defineConfig } from 'vite'
import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import { buildAutoImports, autoImportDtsPlugin } from '../../scanExports.js'

const clientSrc = path.resolve(import.meta.dirname, 'src')

const pkgs = {
  '~client': [
    clientSrc,
    `${clientSrc}/rendering`,
    `${clientSrc}/rendering/entities`,
    `${clientSrc}/rendering/traits`,
  ],
}
const dtsPath = path.resolve(import.meta.dirname, 'auto-imports.d.ts')

export default defineConfig({
  resolve: {
    alias: {
      '~client': clientSrc,
    },
  },
  plugins: [
    AutoImport({
      imports: buildAutoImports(pkgs, clientSrc),
      dts: false,
    }) as any,
    autoImportDtsPlugin(pkgs, clientSrc, dtsPath),
  ],
  publicDir: path.resolve(import.meta.dirname, 'public'),
  server: {
    port: 5173,
    open: false,
  },
})
