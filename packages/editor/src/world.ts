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
import type { RenderEntity } from '@repo/rendering'
import { loadWorld, saveWorld } from '~editor/connection'
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

/** Create a blank world in the editor. */
export function editorNewWorld() {
  ensureBootstrap()
  const w = createEcsWorld()
  world.value = w
  manifest = { seed: 0, tick: 0, chunkSize: 16, chunks: { '0,0': { cx: 0, cy: 0, state: 'frozen', freezeTick: 0 } } }
  currentSaveName.value = null
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
export async function editorSaveWorld(name?: string) {
  const w = world.value
  if (!w || !manifest) return

  const saveName = name ?? currentSaveName.value
  if (!saveName) return

  // Compute which chunks are needed based on actual entity positions.
  const chunkSet = new Set<string>()
  for (const id of queryEntities(w, 'position', 'entityType')) {
    const pos = getComponent(w, id, 'position')!
    const cx = Math.floor(pos.x / manifest.chunkSize)
    const cy = Math.floor(pos.y / manifest.chunkSize)
    chunkSet.add(chunkKey(cx, cy))
  }

  const chunkCoords = [...chunkSet].map(k => {
    const [cx, cy] = k.split('_').map(Number)
    return { cx, cy }
  })

  const newManifest = exportManifest(w, manifest.seed, manifest.chunkSize, chunkCoords)
  const chunks = chunkCoords.map(({ cx, cy }) => ({
    filename: `${chunkKey(cx, cy)}.json`,
    data: exportChunk(w, cx, cy, manifest!.chunkSize),
  }))

  await saveWorld(saveName, newManifest, chunks)
  manifest = newManifest
  currentSaveName.value = saveName
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
export function getEntities(): RenderEntity[] {
  const w = world.value
  if (!w) return []
  const result: RenderEntity[] = []
  for (const id of queryEntities(w, 'position', 'entityType')) {
    const pos = getComponent(w, id, 'position')!
    const et = getComponent(w, id, 'entityType')!
    const traits: Record<string, unknown> = {}
    const gc = getComponent(w, id, 'groundCover')
    if (gc) traits.groundCover = gc
    result.push({ type: et.type, x: pos.x, y: pos.y, z: pos.z, traits })
  }
  return result
}
