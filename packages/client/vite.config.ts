import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  publicDir: path.resolve(import.meta.dirname, 'public'),
  server: {
    port: 5173,
    open: false,
  },
})
