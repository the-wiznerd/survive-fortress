import type { Component } from 'vue'
import type { TraitViews, VisibleTraitName } from '@repo/server/sdk'
import StatText from '~client/components/traits/StatText.vue'
import MovementBar from '~client/components/traits/MovementBar.vue'
import ActionBadge from '~client/components/traits/ActionBadge.vue'
import EquipmentSlots from '~client/components/traits/EquipmentSlots.vue'

type TraitRendererMap = {
  [K in VisibleTraitName]?: {
    component: Component
    props: (data: TraitViews[K]) => Record<string, unknown> | null
  }
}

export const TRAIT_RENDERERS: TraitRendererMap = {
  position: {
    component: StatText,
    props: d => ({ label: 'Position', value: `(${d.x}, ${d.y}, ${d.z})` })
  },
  health: {
    component: StatText,
    props: d => ({
      label: 'Health',
      value: `${d.current}/${d.max}`
    })
  },
  hunger: {
    component: StatText,
    props: d => ({
      label: 'Hunger',
      value: `${d.current}/${d.max}`
    })
  },
  movement: {
    component: MovementBar,
    props: d => ({
      modes: d.modes
    })
  },
  moisture: {
    component: StatText,
    props: d => ({
      label: 'Moisture',
      value: `${d.current}/${d.capacity}`
    })
  },
  groundCover: {
    component: StatText,
    props: d => d.cover
      ? { label: 'Ground Cover', value: String(d.cover) }
      : null
  },
  harvestable: {
    component: ActionBadge,
    props: d => d.available ? { action: 'Harvest' } : null
  },
  carriable: {
    component: StatText,
    props: d => ({ label: 'Size', value: String(d.size) })
  },
  container: {
    component: StatText,
    props: d => ({ label: 'Bag', value: `${d.usedCapacity}/${d.capacity}` })
  },
  edible: {
    component: StatText,
    props: d => ({ label: 'Nutrition', value: String(d.nutrition) })
  },
  wearable: {
    component: StatText,
    props: d => ({ label: 'Wears', value: d.slot })
  },
  equipment: {
    component: EquipmentSlots,
    props: d => {
      if (Object.keys(d.slots).length === 0) return null
      return { slots: d.slots }
    }
  },
}

/** Look up and apply a trait renderer. The renderer ↔ data correlation is
 *  guaranteed by the shared VisibleTraitName key; the cast is needed because
 *  TypeScript can't verify correlated record access through a union key. */
export function renderTrait(name: VisibleTraitName, data: TraitViews[VisibleTraitName]) {
  const renderer = TRAIT_RENDERERS[name] as
    | { component: Component; props: (data: TraitViews[VisibleTraitName]) => Record<string, unknown> | null }
    | undefined
  if (!renderer) return null
  const p = renderer.props(data)
  return p ? { component: renderer.component, props: p } : null
}
