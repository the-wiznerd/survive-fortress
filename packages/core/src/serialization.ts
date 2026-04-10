import {
  type World,
  type EntityId,
  createWorld,
  createEntity,
  addComponent,
  getComponent,
  queryEntities,
} from './ecs.js';
import {
  type WorldManifest,
  type ChunkData,
  type ChunkRef,
  type TileSave,
  type EntitySave,
  chunkKey,
} from './save.js';

// ─── Export: ECS → Save Format ───

/** Build a ChunkData from all terrain and entities in a given chunk region. */
export function exportChunk(
  world: World,
  cx: number,
  cy: number,
  chunkSize: number,
): ChunkData {
  const originX = cx * chunkSize;
  const originY = cy * chunkSize;

  // Initialize terrain grid.
  const terrain: TileSave[][] = [];
  for (let row = 0; row < chunkSize; row++) {
    terrain[row] = [];
    for (let col = 0; col < chunkSize; col++) {
      terrain[row][col] = { type: 'void', spriteCol: 0, spriteRow: 0, elevation: 0 };
    }
  }

  // Fill terrain from entities with terrain component.
  for (const id of queryEntities(world, 'position', 'terrain')) {
    const pos = getComponent(world, id, 'position')!;
    const t = getComponent(world, id, 'terrain')!;
    const lx = pos.x - originX;
    const ly = pos.y - originY;
    if (lx < 0 || lx >= chunkSize || ly < 0 || ly >= chunkSize) continue;
    terrain[ly][lx] = {
      type: t.type,
      spriteCol: t.spriteCol,
      spriteRow: t.spriteRow,
      elevation: pos.elevation,
    };
  }

  // Collect non-terrain entities in this chunk.
  const entities: EntitySave[] = [];
  for (const id of queryEntities(world, 'position')) {
    if (getComponent(world, id, 'terrain')) continue; // skip terrain
    const pos = getComponent(world, id, 'position')!;
    const lx = pos.x - originX;
    const ly = pos.y - originY;
    if (lx < 0 || lx >= chunkSize || ly < 0 || ly >= chunkSize) continue;

    const save: EntitySave = {
      entityType: getEntityType(world, id),
      x: pos.x,
      y: pos.y,
      elevation: pos.elevation,
      components: {},
    };

    // Save known component data (excluding position, which is top-level).
    const health = getComponent(world, id, 'health');
    if (health) save.components.health = { ...health };
    const hunger = getComponent(world, id, 'hunger');
    if (hunger) save.components.hunger = { ...hunger };
    const speed = getComponent(world, id, 'speed');
    if (speed) save.components.speed = { ...speed };

    entities.push(save);
  }

  return { cx, cy, terrain, entities };
}

/** Build a WorldManifest from the current world state. */
export function exportManifest(
  world: World,
  seed: number,
  chunkSize: number,
  chunkCoords: { cx: number; cy: number }[],
): WorldManifest {
  const chunks: Record<string, ChunkRef> = {};
  for (const { cx, cy } of chunkCoords) {
    chunks[chunkKey(cx, cy)] = { cx, cy, state: 'frozen', freezeTick: world.tick };
  }
  return { seed, tick: world.tick, chunkSize, chunks };
}

// ─── Import: Save Format → ECS ───

/** Load a chunk into the ECS world, spawning terrain and entities. */
export function importChunk(
  world: World,
  chunk: ChunkData,
  chunkSize: number,
): void {
  const originX = chunk.cx * chunkSize;
  const originY = chunk.cy * chunkSize;

  // Spawn terrain.
  for (let row = 0; row < chunkSize; row++) {
    for (let col = 0; col < chunkSize; col++) {
      const tile = chunk.terrain[row][col];
      if (tile.type === 'void') continue;
      const id = createEntity(world);
      addComponent(world, id, 'position', {
        x: originX + col,
        y: originY + row,
        elevation: tile.elevation,
      });
      addComponent(world, id, 'terrain', {
        type: tile.type,
        spriteCol: tile.spriteCol,
        spriteRow: tile.spriteRow,
      });
    }
  }

  // Spawn non-terrain entities.
  for (const ent of chunk.entities) {
    const id = createEntity(world);
    addComponent(world, id, 'position', {
      x: ent.x,
      y: ent.y,
      elevation: ent.elevation,
    });

    if (ent.components.health) {
      addComponent(world, id, 'health', ent.components.health as any);
    }
    if (ent.components.hunger) {
      addComponent(world, id, 'hunger', ent.components.hunger as any);
    }
    if (ent.components.speed) {
      addComponent(world, id, 'speed', ent.components.speed as any);
    }
    if (ent.entityType === 'player') {
      addComponent(world, id, 'playerControlled', { pendingAction: null });
    }
  }
}

/** Load a world from a manifest and set of chunk data. Returns the world + player ID (if any). */
export function importWorld(
  manifest: WorldManifest,
  chunks: ChunkData[],
): { world: World; playerIds: EntityId[] } {
  const world = createWorld();
  world.tick = manifest.tick;

  for (const chunk of chunks) {
    importChunk(world, chunk, manifest.chunkSize);
  }

  // Find player entities.
  const playerIds = queryEntities(world, 'playerControlled');

  return { world, playerIds };
}

// ─── Helpers ───

function getEntityType(world: World, id: EntityId): string {
  if (getComponent(world, id, 'playerControlled')) return 'player';
  return 'unknown';
}
