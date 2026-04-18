import { defineConfig } from 'vite'
import path from 'node:path'
import dts from 'vite-plugin-dts'

const serverSrc = path.resolve(import.meta.dirname, 'src')

export default defineConfig({
  resolve: {
    alias: {
      '~server': serverSrc,
    },
  },
  plugins: [
    dts(),
  ],
  build: {
    lib: {
      entry: {
        index: path.resolve(serverSrc, 'index.ts'),
        'sdk/index': path.resolve(serverSrc, 'sdk/index.ts'),
      },
      formats: ['es'],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    rollupOptions: { external: [/^@sf\//] },
  },
})
