import { Renderer } from './renderer.js'

registerEntityType('dirt', Dirt)
registerEntityType('grass', Grass)
registerEntityType('water', Water)
registerEntityType('sand', Sand)
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
const renderer = new Renderer(canvas, 32, 24, 2) // 32×24 viewport, 2× pixel scale

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
  updateInspector()
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
  updateInspector()
}

// ─── Inspector ───

const inspectorEl = document.getElementById('inspector')!

function getEntitiesAtColumn(x: number, y: number): EntityId[] {
  const results: EntityId[] = []
  for (const [id, pos] of world.components.position) {
    if (pos.x === x && pos.y === y) results.push(id)
  }
  return results
}

function updateInspector() {
  if (!world || !inspectedCell) {
    inspectorEl.innerHTML = ''
    return
  }

  const { x, y } = inspectedCell
  const allAtXY = getEntitiesAtColumn(x, y)
  if (allAtXY.length === 0) {
    inspectorEl.innerHTML = `<h2>Tile (${x}, ${y})</h2><div class="stat">Empty</div>`
    return
  }

  // Show the top terrain cube and everything on or above it.
  // The top terrain is the lowest z in the column (the ground block).
  // Once underground layers exist, this will filter out hidden sub-surface entities.
  let groundZ = Infinity
  for (const id of allAtXY) {
    const z = getComponent(world, id, 'position')!.z
    if (z < groundZ) groundZ = z
  }
  const visible = allAtXY.filter(id => getComponent(world, id, 'position')!.z >= groundZ)
  visible.sort((a, b) => getComponent(world, b, 'position')!.z - getComponent(world, a, 'position')!.z)

  let html = `<h2>Tile (${x}, ${y})</h2>`
  for (const id of visible) {
    const pos = getComponent(world, id, 'position')!
    const typeName = getComponent(world, id, 'entityType')?.type ?? 'unknown'
    const inst = getComponent(world, id, 'instance')

    html += `<div class="stat" style="margin-top:8px"><strong>${typeName}</strong> <span class="label">z=${pos.z}</span></div>`

    if (inst) {
      for (const trait of inst.ref.traits) {
        const defaults = trait.defaults()
        const keys = Object.keys(defaults as object)
        const values = keys.map(k => `${k}: ${(trait as unknown as Record<string, unknown>)[k]}`).join(', ')
        html += `<div class="stat"><span class="label">${trait.component}:</span> ${values}</div>`
      }
    }
  }

  inspectorEl.innerHTML = html
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
