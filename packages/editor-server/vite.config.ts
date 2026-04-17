import { defineConfig } from 'vite'
import path from 'node:path'
import dts from 'vite-plugin-dts'

const src = path.resolve(import.meta.dirname, 'src')

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: {
        'sdk/index': path.resolve(src, 'sdk/index.ts'),
      },
      formats: ['es'],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    rollupOptions: { external: [/^node:/, /^ws/] },
  },
})
