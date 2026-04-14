import { Renderer } from './renderer.js'

// ─── Trait Renderer Registry ───

const TRAIT_RENDERERS: Record<string, TraitRenderer> = {
  health: new HealthTraitRenderer(),
  hunger: new HungerTraitRenderer(),
  speed: new SpeedTraitRenderer(),
  moisture: new MoistureTraitRenderer(),
  groundCover: new GroundCoverTraitRenderer(),
}

// ─── DOM References ───

const gameStateEl = document.getElementById('game-state')!
const playerCardEl = document.getElementById('player-card')!
const selectionEl = document.getElementById('selection')!

// ─── Entity Cards ───

function buildEntityCard(id: EntityId, world: World, renderer: Renderer): HTMLElement {
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

// ─── Updates ───

export function updateUI(world: World, playerId: EntityId, renderer: Renderer) {
  // Game state.
  const day = Math.floor(world.tick / TICKS_PER_DAY) + 1
  const tickOfDay = world.tick % TICKS_PER_DAY
  gameStateEl.innerHTML = `
    <div class="stat"><span class="label">Day:</span> ${day}.${String(tickOfDay).padStart(2, '0')}</div>
  `

  // Player card (always visible).
  playerCardEl.innerHTML = ''
  playerCardEl.appendChild(buildEntityCard(playerId, world, renderer))
}

export function updateSelection(world: World, inspectedCell: { x: number; y: number } | null, renderer: Renderer) {
  if (!world || !inspectedCell) {
    selectionEl.innerHTML = ''
    return
  }

  const { x, y } = inspectedCell
  const allAtXY = getEntitiesInColumn(world, x, y)

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
    selectionEl.appendChild(buildEntityCard(id, world, renderer))
  }
}
