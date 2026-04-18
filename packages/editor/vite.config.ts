import { defineConfig } from 'vite'
import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { buildAutoImports, autoImportDtsPlugin } from '../../scanExports.js'

const editorSrc = path.resolve(import.meta.dirname, 'src')
const renderingSrc = path.resolve(import.meta.dirname, '../rendering/src')
const engineSrc = path.resolve(import.meta.dirname, '../engine/src')
const stateSrc = path.resolve(import.meta.dirname, '../state/src')
const editorServerSrc = path.resolve(import.meta.dirname, '../editor-server/src')

const pkgs = {
  '~editor': [
    editorSrc,
  ],
  '~rendering': [
    renderingSrc,
    `${renderingSrc}/entities`,
  ],
  '~engine': [
    engineSrc,
    `${engineSrc}/systems`,
    `${engineSrc}/traits`,
    `${engineSrc}/entityTypes`,
  ],
  '~state': [stateSrc],
  '~editor-server': [
    editorServerSrc,
    `${editorServerSrc}/sdk`,
  ],
}
const dtsPath = path.resolve(import.meta.dirname, 'auto-imports.d.ts')

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
    AutoImport({
      imports: buildAutoImports(pkgs, editorSrc),
      dts: false,
    }) as any,
    autoImportDtsPlugin(pkgs, editorSrc, dtsPath),
  ],
  publicDir: path.resolve(import.meta.dirname, '../client/public'),
  server: {
    port: 5174,
    open: false,
  },
})
