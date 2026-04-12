import { Dirt } from '@sf/core/entityTypes/Dirt'
import { Grass } from '@sf/core/entityTypes/Grass'
import { Water } from '@sf/core/entityTypes/Water'
import { Sand } from '@sf/core/entityTypes/Sand'
import { Player } from '@sf/core/entityTypes/Player'
import { Renderer } from './renderer.js'

registerEntityType(new Dirt())
registerEntityType(new Grass())
registerEntityType(new Water())
registerEntityType(new Sand())
registerEntityType(new Player())

// ─── Game State ───

let world: World
let playerId: EntityId
let pendingInput: Action | null = null

const SAVE_PATH = '/saves/test-world'
const TICK_INTERVAL_MS = 1000

async function init() {
  // Load world manifest.
  const manifestResp = await fetch(`${SAVE_PATH}/world.json`)
  const manifest: WorldManifest = await manifestResp.json()

  // Load all referenced chunks.
  const chunks: ChunkData[] = []
  for (const ref of Object.values(manifest.chunks)) {
    const chunkResp = await fetch(`${SAVE_PATH}/chunks/${ref.cx}_${ref.cy}.json`)
    chunks.push(await chunkResp.json())
  }

  // Import into ECS.
  const result = importWorld(manifest, chunks)
  world = result.world
  playerId = result.playerIds[0]

  const pos = getComponent(world, playerId, 'position')!
  renderer.setCamera(pos.x, pos.y)
  updateUI()
  renderer.render(world)
}

// ─── Renderer ───

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const renderer = new Renderer(canvas, 32, 24, 2) // 32×24 viewport, 2× pixel scale

// Re-render once sprite sheet finishes loading (only if world is ready).
renderer.onReady = () => { if (world) renderer.render(world); }

// ─── Input ───

document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp': pendingInput = { type: 'move', dx: 0, dy: -1 }; break
    case 'ArrowDown': pendingInput = { type: 'move', dx: 0, dy: 1 }; break
    case 'ArrowLeft': pendingInput = { type: 'move', dx: -1, dy: 0 }; break
    case 'ArrowRight': pendingInput = { type: 'move', dx: 1, dy: 0 }; break
    case ' ': pendingInput = { type: 'wait' }; break
    case 'r': case 'R': init().catch(console.error); break
  }
})

// ─── Tick Loop ───

function gameTick() {
  if (!world) return

  const pc = getComponent(world, playerId, 'playerControlled')!
  pc.pendingAction = pendingInput ?? { type: 'wait' }
  pendingInput = null

  tick(world)

  const pos = getComponent(world, playerId, 'position')
  if (pos) renderer.setCamera(pos.x, pos.y)
  updateUI()
}

setInterval(gameTick, TICK_INTERVAL_MS)

// ─── UI ───

const statsEl = document.getElementById('stats')!

function updateUI() {
  const health = getComponent(world, playerId, 'health')
  const hunger = getComponent(world, playerId, 'hunger')
  const pos = getComponent(world, playerId, 'position')
  const speed = getComponent(world, playerId, 'speed')

  statsEl.innerHTML = `
    <div class="stat"><span class="label">Tick:</span> ${world.tick}</div>
    <div class="stat"><span class="label">Pos:</span> ${pos?.x}, ${pos?.y}</div>
    <div class="stat"><span class="label">HP:</span> ${health?.current}/${health?.max}</div>
    <div class="stat"><span class="label">Hunger:</span> ${hunger?.current}/${hunger?.max}</div>
    <div class="stat"><span class="label">AP:</span> ${speed?.ap}</div>
  `
}

// ─── Animation Loop ───

function animationLoop() {
  if (world) renderer.render(world)
  requestAnimationFrame(animationLoop)
}
requestAnimationFrame(animationLoop)

// ─── Start ───

init().catch(console.error)
