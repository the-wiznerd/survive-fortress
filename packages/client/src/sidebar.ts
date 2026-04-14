import type { Game, GameView, ViewEntity, InspectResult } from '@repo/server/sdk'

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

// ─── Constants ───

const TICKS_PER_DAY = 100

// ─── Entity Cards ───

function buildEntityCard(entity: ViewEntity, renderer: Renderer): HTMLElement {
  const label = entity.name ? `${entity.name} (${entity.type})` : entity.type
  const card = document.createElement('entity-card')
  card.setAttribute('label', label)

  const er = renderer.getEntityRenderer(entity.type)
  if (er) {
    for (const traitName of er.describeTraits(entity)) {
      const data = entity.traits[traitName]
      const tr = TRAIT_RENDERERS[traitName]
      if (tr && data) card.appendChild(tr.render(data))
    }
  }

  return card
}

// ─── Updates ───

export function updateUI(view: GameView, renderer: Renderer) {
  // Game state.
  const day = Math.floor(view.tick / TICKS_PER_DAY) + 1
  const tickOfDay = view.tick % TICKS_PER_DAY
  gameStateEl.innerHTML = `
    <div class="stat"><span class="label">Day:</span> ${day}.${String(tickOfDay).padStart(2, '0')}</div>
  `

  // Player card (always visible).
  const player = view.entities.find(e => String(e.id) === view.playerId)
  playerCardEl.innerHTML = ''
  if (player) playerCardEl.appendChild(buildEntityCard(player, renderer))
}

export function updateSelection(inspectResult: InspectResult | null, inspectedCell: { x: number; y: number } | null, renderer: Renderer) {
  if (!inspectResult || !inspectedCell) {
    selectionEl.innerHTML = ''
    return
  }

  const { x, y } = inspectedCell
  const entities = inspectResult.entities

  if (entities.length === 0) {
    selectionEl.innerHTML = `<h2>Tile (${x}, ${y})</h2><div class="stat">Empty</div>`
    return
  }

  // Show entities sorted by z descending.
  const sorted = [...entities].sort((a, b) => b.z - a.z)

  selectionEl.innerHTML = ''
  const heading = document.createElement('h2')
  heading.textContent = `Tile (${x}, ${y})`
  selectionEl.appendChild(heading)

  for (const entity of sorted) {
    selectionEl.appendChild(buildEntityCard(entity, renderer))
  }
}
