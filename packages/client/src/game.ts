import { Renderer } from '@sf/ui'

// ─── Game State ───

let world: World
let playerId: EntityId

const SAVE_PATH = '/saves/test-world'
const TICK_INTERVAL_MS = 1000

export function getWorld(): World { return world }
export function getPlayerId(): EntityId { return playerId }

export async function init(renderer: Renderer) {
  const manifestResp = await fetch(`${SAVE_PATH}/world.json`)
  const manifest: WorldManifest = await manifestResp.json()

  const chunks: ChunkData[] = []
  for (const ref of Object.values(manifest.chunks)) {
    const chunkResp = await fetch(`${SAVE_PATH}/chunks/${ref.cx}_${ref.cy}.json`)
    chunks.push(await chunkResp.json())
  }

  const result = importWorld(manifest, chunks)
  world = result.world
  playerId = result.playerIds[0]

  const pos = getComponent(world, playerId, 'position')!
  renderer.setCamera(pos.x, pos.y)
}

export function gameTick(renderer: Renderer, pendingInput: Action | null): void {
  if (!world) return

  const pc = getComponent(world, playerId, 'playerControlled')!
  pc.pendingAction = pendingInput ?? { type: 'wait' }

  tick(world)

  const pos = getComponent(world, playerId, 'position')
  if (pos) renderer.setCamera(pos.x, pos.y)
}

export function startTickLoop(renderer: Renderer, getInput: () => Action | null, onTick: () => void) {
  setInterval(() => {
    const input = getInput()
    gameTick(renderer, input)
    onTick()
  }, TICK_INTERVAL_MS)
}
