import { defineConfig } from 'vitest/config'
import path from 'node:path'
import dts from 'vite-plugin-dts'

const engineSrc = path.resolve(import.meta.dirname, 'src')

export default defineConfig({
  resolve: {
    alias: {
      '~engine': engineSrc,
    },
  },
  plugins: [
    dts({ rollupTypes: true }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
  },
  build: {
    lib: { entry: path.resolve(engineSrc, 'index.ts'), formats: ['es'], fileName: 'index' },
    rollupOptions: { external: [/^@sf\//] },
  },
})
