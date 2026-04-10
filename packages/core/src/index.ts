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

export { spawnPlayer, spawnTerrain } from './spawners.js';

export {
  type WorldManifest,
  type ChunkRef,
  type ChunkData,
  type TileSave,
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
