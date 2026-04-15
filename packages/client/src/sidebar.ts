import { createApp, reactive } from 'vue'
import type { GameView, ViewEntity, InspectResult } from '@repo/server/sdk'

// ─── Constants ───

const TICKS_PER_DAY = 100

// ─── Trait Formatters ───

interface FormattedTrait {
  label: string
  value: string
}

const TRAIT_FORMATTERS: Record<string, (data: Record<string, unknown>) => FormattedTrait | null> = {
  health: (d) => ({ label: 'Health', value: `${d.current}/${d.max}` }),
  hunger: (d) => ({ label: 'Hunger', value: `${d.current}/${d.max}` }),
  speed: (d) => ({ label: 'Speed', value: String(d.pace) }),
  moisture: (d) => ({ label: 'Moisture', value: `${d.current}/${d.capacity}` }),
  groundCover: (d) => d.cover ? { label: 'Ground Cover', value: String(d.cover) } : null,
}

// ─── Display Entity ───

interface DisplayEntity {
  id: number
  label: string
  traits: FormattedTrait[]
}

function toDisplayEntity(entity: ViewEntity, renderer: Renderer): DisplayEntity {
  const label = entity.name ? `${entity.name} (${entity.type})` : entity.type
  const er = renderer.getEntityRenderer(entity.type)
  const traitNames = er ? er.describeTraits(entity) : []
  const traits: FormattedTrait[] = []
  for (const name of traitNames) {
    const data = entity.traits[name]
    const fmt = TRAIT_FORMATTERS[name]
    if (!data || !fmt) continue
    const result = fmt(data)
    if (result) traits.push(result)
  }
  return { id: entity.id, label, traits }
}

// ─── Reactive Store ───

const store = reactive({
  day: 0,
  tickOfDay: '00',
  player: null as DisplayEntity | null,
  selection: null as { x: number; y: number; entities: DisplayEntity[] } | null,
})

// ─── Mount Vue App ───

export function initSidebar() {
  createApp({ setup: () => ({ store }) }).mount('#sidebar')
}

// ─── Updates ───

export function updateUI(view: GameView, renderer: Renderer) {
  store.day = Math.floor(view.tick / TICKS_PER_DAY) + 1
  store.tickOfDay = String(view.tick % TICKS_PER_DAY).padStart(2, '0')

  const player = view.entities.find(e => String(e.id) === view.playerId)
  store.player = player ? toDisplayEntity(player, renderer) : null
}

export function updateSelection(inspectResult: InspectResult | null, inspectedCell: { x: number; y: number } | null, renderer: Renderer) {
  if (!inspectResult || !inspectedCell) {
    store.selection = null
    return
  }

  const { x, y } = inspectedCell
  const sorted = [...inspectResult.entities].sort((a, b) => b.z - a.z)
  store.selection = {
    x,
    y,
    entities: sorted.map(e => toDisplayEntity(e, renderer)),
  }
}
