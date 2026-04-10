import { defineConfig } from 'vitest/config'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'

// Shared auto-import list for @sf/core public API.
export const coreImports: Record<string, string[]> = {
  '@sf/core/ecs': [
    'createWorld',
    'createEntity',
    'addComponent',
    'getComponent',
    'hasComponent',
    'removeEntity',
    'queryEntities',
  ],
  '@sf/core/tick': [
    'movementSystem',
    'hungerSystem',
    'tick',
    'simulate',
  ],
  '@sf/core/registry': [
    'registerEntityType',
    'getEntityTypeDef',
    'getRegisteredTypes',
    'exportComponents',
    'importComponents',
  ],
  '@sf/core/serialization': [
    'exportChunk',
    'exportManifest',
    'importChunk',
    'importWorld',
  ],
  '@sf/core/save': [
    'chunkKey',
    'parseChunkKey',
  ],
}

export default defineConfig({
  resolve: {
    alias: {
      '@sf/core': path.resolve(__dirname, 'packages/core/src'),
    },
  },
  plugins: [
    AutoImport({
      imports: Object.entries(coreImports).map(([from, names]) => ({ [from]: names })),
      dts: path.resolve(__dirname, 'auto-imports.d.ts'),
    }),
  ],
  test: {
    include: ['packages/*/tests/**/*.test.ts'],
  },
})
