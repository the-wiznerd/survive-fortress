import { defineConfig } from 'vite'
import path from 'node:path'
import fs from 'node:fs'
import vue from '@vitejs/plugin-vue'

const clientSrc = path.resolve(import.meta.dirname, 'src')
const renderingSrc = path.resolve(import.meta.dirname, '../rendering/src')
const engineSrc = path.resolve(import.meta.dirname, '../engine/src')
const stateSrc = path.resolve(import.meta.dirname, '../state/src')
const serverSrc = path.resolve(import.meta.dirname, '../server/src')

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
      '~rendering': renderingSrc,
      '~engine': engineSrc,
      '~state': stateSrc,
      '~server': serverSrc,
      '@repo/rendering': path.join(renderingSrc, 'index.ts'),
      '@repo/engine': path.join(engineSrc, 'index.ts'),
      '@repo/state': path.join(stateSrc, 'index.ts'),
      '@repo/server/sdk': path.join(serverSrc, 'sdk/index.ts'),
      '@repo/server': path.join(serverSrc, 'index.ts'),
    },
  },
  plugins: [
    vue(),
    serveSavesPlugin(),
  ],
  publicDir: path.resolve(import.meta.dirname, 'public'),
  server: {
    port: 5173,
    strictPort: true,
    open: false,
  },
})
