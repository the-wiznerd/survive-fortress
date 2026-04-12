import { defineConfig } from 'vitest/config';
import path from 'node:path';
import AutoImport from 'unplugin-auto-import/vite';
// Shared auto-import list for @sf/core public API.
export const coreImports = {
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
    '@sf/core/traits/Trait': ['Trait'],
    '@sf/core/traits/EntityTypeTrait': ['EntityTypeTrait'],
    '@sf/core/traits/PositionTrait': ['PositionTrait'],
    '@sf/core/traits/MoistureTrait': ['MoistureTrait'],
    '@sf/core/traits/HealthTrait': ['HealthTrait'],
    '@sf/core/traits/HungerTrait': ['HungerTrait'],
    '@sf/core/traits/SpeedTrait': ['SpeedTrait'],
    '@sf/core/traits/PlayerControlledTrait': ['PlayerControlledTrait'],
    '@sf/core/systems/movement': ['movementSystem'],
    '@sf/core/systems/hunger': ['hungerSystem'],
    '@sf/core/systems/moisture': ['moistureSystem'],
    '@sf/core/systems/entityTypeTick': ['entityTypeTickSystem'],
};
export default defineConfig({
    resolve: {
        alias: {
            '@sf/core': path.resolve(import.meta.dirname, 'packages/core/src'),
        },
    },
    plugins: [
        AutoImport({
            imports: Object.entries(coreImports).map(([from, names]) => ({ [from]: names })),
            dts: path.resolve(import.meta.dirname, 'auto-imports.d.ts'),
        }),
    ],
    test: {
        include: ['packages/*/tests/**/*.test.ts'],
    },
});
//# sourceMappingURL=vitest.config.js.map