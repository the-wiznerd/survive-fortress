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
  css: {
    preprocessorOptions: {
      scss: {
        // Auto-imports helpers from styles/utilities/_index.scss into every
        // Vue SFC <style lang="scss"> block (and any non-styles/ scss
        // module). Skip files under styles/ to avoid @use cycles in the
        // helper modules themselves.
        //
        // Helpers are forwarded with topical prefixes so call sites
        // self-document the source:
        //   pixel-sim-space(2)
        //   @include pixel-sim-border
        //   @include button-base
        //   @include ts-heading-primary
        additionalData: (source: string, filename: string) => {
          if (filename.includes(`${path.sep}styles${path.sep}`)) {
            return source
          }
          return `@use "~styles/utilities" as *;\n${source}`
        },
      },
    },
  },
  build: {
    emptyOutDir: false,
  },
  server: {
    port: 5173,
    strictPort: true,
    open: false,
  },
})
