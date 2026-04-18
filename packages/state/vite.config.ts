import { defineConfig } from 'vite'
import path from 'node:path'
import dts from 'vite-plugin-dts'

const stateSrc = path.resolve(import.meta.dirname, 'src')

export default defineConfig({
  resolve: {
    alias: {
      '~state': stateSrc,
    },
  },
  plugins: [
    dts({ rollupTypes: true }),
  ],
  build: {
    lib: { entry: path.resolve(stateSrc, 'index.ts'), formats: ['es'], fileName: 'index' },
  },
})
