import { Renderer } from './renderer.js'
import './components/entity-card.js'
import './components/stat-text.js'

registerEntityType('dirt', Dirt)
registerEntityType('water', Water)
registerEntityType('sand', Sand)
registerEntityType('stone', Stone)
registerEntityType('player', Player)

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
const renderer = new Renderer(canvas, 32, 24, 3) // 32×24 viewport, 2× pixel scale

// Re-render once sprite sheet finishes loading (only if world is ready).
renderer.onReady = () => { if (world) renderer.render(world); }

// ─── Input ───

let inspectedCell: { x: number; y: number } | null = null
let hoveredCell: { x: number; y: number } | null = null

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const cell = renderer.screenToWorld(
    (e.clientX - rect.left) * scaleX,
    (e.clientY - rect.top) * scaleY,
  )
  inspectedCell = cell
  updateSelection()
})

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  hoveredCell = renderer.screenToWorld(
    (e.clientX - rect.left) * scaleX,
    (e.clientY - rect.top) * scaleY,
  )
})

canvas.addEventListener('mouseleave', () => {
  hoveredCell = null
})

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

// ─── Trait Renderer Registry ───

const TRAIT_RENDERERS: Record<string, TraitRenderer> = {
  health: new HealthTraitRenderer(),
  hunger: new HungerTraitRenderer(),
  speed: new SpeedTraitRenderer(),
  moisture: new MoistureTraitRenderer(),
  groundCover: new GroundCoverTraitRenderer(),
}

// ─── UI ───

const gameStateEl = document.getElementById('game-state')!
const playerCardEl = document.getElementById('player-card')!
const selectionEl = document.getElementById('selection')!

function buildEntityCard(id: EntityId, world: World): HTMLElement {
  const typeName = getComponent(world, id, 'entityType')?.type ?? 'unknown'
  const name = getComponent(world, id, 'name')?.name
  const label = name ? `${name} (${typeName})` : typeName
  const card = document.createElement('entity-card')
  card.setAttribute('label', label)

  const er = renderer.getEntityRenderer(typeName)
  if (er) {
    for (const traitName of er.describe(id, world)) {
      const tr = TRAIT_RENDERERS[traitName]
      if (tr) card.appendChild(tr.render(id, world))
    }
  }

  return card
}

function updateUI() {
  // Game state.
  const day = Math.floor(world.tick / TICKS_PER_DAY) + 1
  const tickOfDay = world.tick % TICKS_PER_DAY
  gameStateEl.innerHTML = `
    <div class="stat"><span class="label">Day:</span> ${day}.${String(tickOfDay).padStart(2, '0')}</div>
  `

  // Player card (always visible).
  playerCardEl.innerHTML = ''
  playerCardEl.appendChild(buildEntityCard(playerId, world))

  // Selected tile.
  updateSelection()
}

// ─── Selection ───

function getEntitiesAtColumn(x: number, y: number): EntityId[] {
  const results: EntityId[] = []
  for (const [id, pos] of world.components.position) {
    if (pos.x === x && pos.y === y) results.push(id)
  }
  return results
}

function updateSelection() {
  if (!world || !inspectedCell) {
    selectionEl.innerHTML = ''
    return
  }

  const { x, y } = inspectedCell
  const allAtXY = getEntitiesAtColumn(x, y)
  if (allAtXY.length === 0) {
    selectionEl.innerHTML = `<h2>Tile (${x}, ${y})</h2><div class="stat">Empty</div>`
    return
  }

  // Show entities at or above ground level.
  let groundZ = Infinity
  for (const id of allAtXY) {
    const z = getComponent(world, id, 'position')!.z
    if (z < groundZ) groundZ = z
  }
  const visible = allAtXY.filter(id => getComponent(world, id, 'position')!.z >= groundZ)
  visible.sort((a, b) => getComponent(world, b, 'position')!.z - getComponent(world, a, 'position')!.z)

  selectionEl.innerHTML = ''
  const heading = document.createElement('h2')
  heading.textContent = `Tile (${x}, ${y})`
  selectionEl.appendChild(heading)

  for (const id of visible) {
    selectionEl.appendChild(buildEntityCard(id, world))
  }
}

// ─── Animation Loop ───

function animationLoop() {
  if (world) {
    renderer.hoveredCell = hoveredCell
    renderer.selectedCell = inspectedCell
    renderer.render(world)
  }
  requestAnimationFrame(animationLoop)
}
requestAnimationFrame(animationLoop)

// ─── Start ───

init().catch(console.error)
