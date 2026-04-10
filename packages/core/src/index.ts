// @sf/core — Pure simulation library. Zero I/O.

export {
  type EntityId,
  type ComponentTypes,
  type ComponentName,
  type Position,
  type Health,
  type Hunger,
  type Speed,
  type PlayerControlled,
  type Terrain,
  type EntityType,
  type Action,
  type World,
  createWorld,
  createEntity,
  addComponent,
  getComponent,
  hasComponent,
  removeEntity,
  queryEntities,
} from './ecs.js';

export { type System, movementSystem, hungerSystem, tick, simulate } from './tick.js';

export {
  type EntityTypeDef,
  registerEntityType,
  getEntityTypeDef,
  getRegisteredTypes,
  exportComponents,
  importComponents,
} from './registry.js';

export { registerAllTypes } from './entity-types.js';

export {
  type WorldManifest,
  type ChunkRef,
  type ChunkData,
  type EntitySave,
  chunkKey,
  parseChunkKey,
} from './save.js';

export {
  exportChunk,
  exportManifest,
  importChunk,
  importWorld,
} from './serialization.js';
