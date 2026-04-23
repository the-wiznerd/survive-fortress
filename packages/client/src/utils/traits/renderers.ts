import type { Component } from 'vue'
import type { TraitViews, ViewEntity, VisibleTraitName } from '@repo/server/sdk'
import StatText from '~client/components/traits/StatText.vue'
import ActionButton from '~client/components/traits/ActionButton.vue'
import EquipmentSlots from '~client/components/traits/EquipmentSlots.vue'

type TraitRendererMap = {
  [K in VisibleTraitName]?: {
    component: Component
    props: (data: TraitViews[K], entity: ViewEntity) => Record<string, unknown> | null
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
  // movement: {
  //   component: MovementBar,
  //   props: d => ({
  //     modes: d.modes
  //   })
  // },
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
    component: ActionButton,
    props: (d, entity) => d.available
      ? { label: 'Harvest', action: { type: 'harvest', targetId: entity.id } }
      : null
  },
  // carriable size and stackable count are intentionally not rendered as
  // separate stats — callers surface them in the entity label instead.
  container: {
    component: StatText,
    props: d => ({ label: 'Bag', value: `${d.usedCapacity}/${d.capacity}` })
  },
  edible: {
    component: ActionButton,
    props: (d, entity) => ({
      label: `Eat (+${d.nutrition})`,
      action: { type: 'eat', targetId: entity.id },
    }),
  },
  contained: {
    component: ActionButton,
    props: (_d, entity) => ({
      label: 'Drop',
      action: { type: 'drop', targetId: entity.id, dx: 0, dy: 0 },
    }),
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
  actor: {
    component: StatText,
    props: d => ({ label: 'AP/Round', value: String(d.pointsPerRound) })
  },
}

/** Look up and apply a trait renderer. The renderer ↔ data correlation is
 *  guaranteed by the shared VisibleTraitName key; the cast is needed because
 *  TypeScript can't verify correlated record access through a union key. */
export function renderTrait(
  name: VisibleTraitName,
  data: TraitViews[VisibleTraitName],
  entity: ViewEntity,
) {
  const renderer = TRAIT_RENDERERS[name] as
    | { component: Component; props: (data: TraitViews[VisibleTraitName], entity: ViewEntity) => Record<string, unknown> | null }
    | undefined
  if (!renderer) return null
  const p = renderer.props(data, entity)
  return p ? { component: renderer.component, props: p } : null
}
