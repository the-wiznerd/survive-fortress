// Side-effect imports: each module self-registers its entity type.
import '../../core/src/entity-types/dirt.js'
import '../../core/src/entity-types/water.js'
import '../../core/src/entity-types/player.js'
import { Renderer } from './renderer.js'

// ─── Game State ───

let world: World
let playerId: EntityId
let autoPlay = false
let autoPlayInterval: ReturnType<typeof setInterval> | null = null

const SAVE_PATH = '/saves/test-world'

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

function submitAction(action: Action) {
  const pc = getComponent(world, playerId, 'playerControlled')!
  pc.pendingAction = action
  tick(world)

  // Update camera before rendering so the player stays centered.
  const pos = getComponent(world, playerId, 'position')
  if (pos) renderer.setCamera(pos.x, pos.y)

  updateUI()
  renderer.render(world)
}

document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp': submitAction({ type: 'move', dx: 0, dy: -1 }); break
    case 'ArrowDown': submitAction({ type: 'move', dx: 0, dy: 1 }); break
    case 'ArrowLeft': submitAction({ type: 'move', dx: -1, dy: 0 }); break
    case 'ArrowRight': submitAction({ type: 'move', dx: 1, dy: 0 }); break
    case ' ': submitAction({ type: 'wait' }); break
    case 'p': case 'P': toggleAutoPlay(); break
    case 'r': case 'R': init().catch(console.error); break
  }
})

function toggleAutoPlay() {
  autoPlay = !autoPlay
  if (autoPlay) {
    autoPlayInterval = setInterval(() => {
      submitAction({ type: 'wait' })
    }, 200)
  } else if (autoPlayInterval) {
    clearInterval(autoPlayInterval)
    autoPlayInterval = null
  }
}

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

// ─── Start ───

init().catch(console.error)
