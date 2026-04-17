import {
  createWorld as createEcsWorld,
  queryEntities,
  getComponent,
  removeEntity,
  type World,
  type WorldManifest,
  type ChunkData,
  chunkKey,
} from '@repo/state'
import {
  bootstrap,
  importWorld,
  importChunk,
  exportChunk,
  exportManifest,
  spawnEntity,
} from '@repo/engine'
import { loadWorld, saveWorld } from './connection'
import { ref, shallowRef } from 'vue'

/** Current ECS world instance. */
export const world = shallowRef<World | null>(null)

/** Name of the currently loaded save. */
export const currentSaveName = ref<string | null>(null)

/** Current manifest data. */
let manifest: WorldManifest | null = null

let bootstrapped = false

function ensureBootstrap() {
  if (!bootstrapped) {
    bootstrap()
    bootstrapped = true
  }
}

/** Load a world from the editor-server by name. */
export async function editorLoadWorld(name: string) {
  ensureBootstrap()
  const raw = await loadWorld(name)
  const m = raw.manifest as WorldManifest
  const { world: w } = importWorld(m, raw.chunks as ChunkData[])
  world.value = w
  manifest = m
  currentSaveName.value = name
}

/** Save the current world back to the editor-server. */
export async function editorSaveWorld() {
  const w = world.value
  if (!w || !manifest || !currentSaveName.value) return

  const chunkCoords = Object.values(manifest.chunks).map(c => ({ cx: c.cx, cy: c.cy }))
  const newManifest = exportManifest(w, manifest.seed, manifest.chunkSize, chunkCoords)
  const chunks = chunkCoords.map(({ cx, cy }) => ({
    filename: `${chunkKey(cx, cy)}.json`,
    data: exportChunk(w, cx, cy, manifest!.chunkSize),
  }))

  await saveWorld(currentSaveName.value, newManifest, chunks)
  manifest = newManifest
}

/** Place an entity of the given type at world position. */
export function placeEntity(type: string, x: number, y: number, z: number) {
  const w = world.value
  if (!w) return
  spawnEntity(w, type, { position: { x, y, z } })
}

/** Remove all entities at a world position. */
export function deleteEntities(x: number, y: number, z: number) {
  const w = world.value
  if (!w) return
  for (const id of queryEntities(w, 'position', 'entityType')) {
    const pos = getComponent(w, id, 'position')!
    if (pos.x === x && pos.y === y && pos.z === z) {
      removeEntity(w, id)
    }
  }
}

/** Get all entities as a flat list for rendering. */
export function getEntities(): { id: number; type: string; x: number; y: number; z: number }[] {
  const w = world.value
  if (!w) return []
  const result: { id: number; type: string; x: number; y: number; z: number }[] = []
  for (const id of queryEntities(w, 'position', 'entityType')) {
    const pos = getComponent(w, id, 'position')!
    const et = getComponent(w, id, 'entityType')!
    result.push({ id, type: et.type, x: pos.x, y: pos.y, z: pos.z })
  }
  return result
}
