import { defineConfig } from 'vite'
import path from 'node:path'
import fs from 'node:fs'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { buildAutoImports, autoImportDtsPlugin } from '../../scanExports.js'

const clientSrc = path.resolve(import.meta.dirname, 'src')

const pkgs = {
  '~client': [
    clientSrc,
  ],
}
const dtsPath = path.resolve(import.meta.dirname, 'auto-imports.d.ts')
const savesDir = path.resolve(import.meta.dirname, '../../saves')

/** Serve /saves/* from the top-level saves directory during dev. */
function serveSavesPlugin() {
  return {
    name: 'serve-saves',
    configureServer(server: any) {
      server.middlewares.use('/saves', (req: any, res: any, next: any) => {
        const filePath = path.join(savesDir, req.url!)
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          res.setHeader('Content-Type', 'application/json')
          fs.createReadStream(filePath).pipe(res)
        } else {
          next()
        }
      })
    },
  }
}

export default defineConfig({
  resolve: {
    alias: {
      '~client': clientSrc,
    },
  },
  plugins: [
    vue(),
    AutoImport({
      imports: buildAutoImports(pkgs, clientSrc),
      dts: false,
    }) as any,
    autoImportDtsPlugin(pkgs, clientSrc, dtsPath),
    serveSavesPlugin(),
  ],
  publicDir: path.resolve(import.meta.dirname, 'public'),
  server: {
    port: 5173,
    open: false,
  },
})
