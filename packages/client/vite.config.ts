import { defineConfig } from 'vite'
import path from 'node:path'
import vue from '@vitejs/plugin-vue'

const clientSrc = path.resolve(import.meta.dirname, 'src')
const renderingSrc = path.resolve(import.meta.dirname, '../rendering/src')
const serverSrc = path.resolve(import.meta.dirname, '../server/src')

export default defineConfig({
  resolve: {
    alias: {
      '~client': clientSrc,
      '~styles': path.resolve(clientSrc, 'styles'),
      '~rendering': renderingSrc,
      '@repo/rendering': path.join(renderingSrc, 'index.ts'),
      '@repo/server/sdk': path.join(serverSrc, 'sdk/index.ts'),
    },
  },
  plugins: [
    vue(),
  ],
  publicDir: path.resolve(import.meta.dirname, 'public'),
  build: {
    emptyOutDir: false,
  },
  server: {
    port: 5173,
    strictPort: true,
    open: false,
  },
})
