import { defineConfig } from 'vite'
import path from 'node:path'
import vue from '@vitejs/plugin-vue'

const editorSrc = path.resolve(import.meta.dirname, 'src')
const renderingSrc = path.resolve(import.meta.dirname, '../rendering/src')
const engineSrc = path.resolve(import.meta.dirname, '../engine/src')
const stateSrc = path.resolve(import.meta.dirname, '../state/src')
const editorServerSrc = path.resolve(import.meta.dirname, '../editor-server/src')

export default defineConfig({
  resolve: {
    alias: {
      '~editor': editorSrc,
      '~rendering': renderingSrc,
      '~engine': engineSrc,
      '~state': stateSrc,
      '~editor-server': editorServerSrc,
      '@repo/rendering': path.join(renderingSrc, 'index.ts'),
      '@repo/engine': path.join(engineSrc, 'index.ts'),
      '@repo/state': path.join(stateSrc, 'index.ts'),
      '@repo/editor-server/sdk': path.join(editorServerSrc, 'sdk/index.ts'),
    },
  },
  plugins: [
    vue(),
  ],
  publicDir: path.resolve(import.meta.dirname, '../client/public'),
  server: {
    port: 5174,
    strictPort: true,
    open: false,
  },
})
