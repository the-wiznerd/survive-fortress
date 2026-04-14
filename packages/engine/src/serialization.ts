import {
  queryEntities,
  getComponent,
  chunkKey,
  createWorld,
  type World,
  type EntityId,
  type ChunkData,
  type ChunkRef,
  type EntitySave,
  type WorldManifest,
} from '@repo/state'

// ─── Export: ECS → Save Format ───

/** Build a ChunkData from all entities in a given chunk region. */
export function exportChunk(
  world: World,
  cx: number,
  cy: number,
  chunkSize: number,
): ChunkData {
  const originX = cx * chunkSize
  const originY = cy * chunkSize

  const entities: EntitySave[] = []

  for (const id of queryEntities(world, 'position', 'entityType')) {
    const pos = getComponent(world, id, 'position')!
    const lx = pos.x - originX
    const ly = pos.y - originY
    if (lx < 0 || lx >= chunkSize || ly < 0 || ly >= chunkSize) continue

    const inst = getComponent(world, id, 'instance')
    if (!inst) continue

    entities.push((inst.ref as BaseEntityType).export() as EntitySave)
  }

  return { cx, cy, entities }
}

/** Build a WorldManifest from the current world state. */
export function exportManifest(
  world: World,
  seed: number,
  chunkSize: number,
  chunkCoords: { cx: number; cy: number }[],
): WorldManifest {
  const chunks: Record<string, ChunkRef> = {}
  for (const { cx, cy } of chunkCoords) {
    chunks[chunkKey(cx, cy)] = { cx, cy, state: 'frozen', freezeTick: world.tick }
  }
  return { seed, tick: world.tick, chunkSize, chunks }
}

// ─── Import: Save Format → ECS ───

/** Load a chunk into the ECS world, spawning entities via the registry. */
export function importChunk(
  world: World,
  chunk: ChunkData,
): void {
  for (const ent of chunk.entities) {
    if (!ent.entityType) {
      console.warn('Entity missing entityType, skipping')
      continue
    }
    spawnEntity(world, ent.entityType, ent as Record<string, unknown>)
  }
}

/** Load a world from a manifest and set of chunk data. Returns the world + player ID (if any). */
export function importWorld(
  manifest: WorldManifest,
  chunks: ChunkData[],
): { world: World; playerIds: EntityId[] } {
  const world = createWorld()
  world.tick = manifest.tick

  for (const chunk of chunks) {
    importChunk(world, chunk)
  }

  // Find player entities.
  const playerIds = queryEntities(world, 'playerControlled')

  return { world, playerIds }
}
