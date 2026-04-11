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
    'getEntitiesAt',
    'getNeighborCoords',
  ],
  '@sf/core/tick': [
    'tick',
    'simulate',
  ],
  '@sf/core/registry': [
    'BaseEntityType',
    'registerEntityType',
    'getEntityTypeDef',
    'getRegisteredTypes',
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
  '@sf/core/traits/trait': ['Trait'],
  '@sf/core/traits/moisture': ['MoistureTrait'],
  '@sf/core/traits/health': ['HealthTrait'],
  '@sf/core/traits/hunger': ['HungerTrait'],
  '@sf/core/traits/speed': ['SpeedTrait'],
  '@sf/core/traits/playerControlled': ['PlayerControlledTrait'],
  '@sf/core/systems/movement': ['movementSystem'],
  '@sf/core/systems/hunger': ['hungerSystem'],
  '@sf/core/systems/moisture': ['moistureSystem'],
  '@sf/core/systems/entityTypeTick': ['entityTypeTickSystem'],
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
