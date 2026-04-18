import { defineConfig } from 'vite'
import path from 'node:path'
import dts from 'vite-plugin-dts'

const src = path.resolve(import.meta.dirname, 'src')

export default defineConfig({
  resolve: {
    alias: {
      '~rendering': src,
    },
  },
  plugins: [
    dts({ rollupTypes: true }),
  ],
  build: {
    lib: { entry: path.resolve(src, 'index.ts'), formats: ['es'], fileName: 'index' },
  },
})
