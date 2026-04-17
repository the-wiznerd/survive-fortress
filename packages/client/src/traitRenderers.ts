import type { Component } from 'vue'
import type { TraitViews, VisibleTraitName } from '@repo/server/sdk'
import StatText from './components/traits/StatText.vue'
import MovementBar from './components/traits/MovementBar.vue'

type TraitRendererMap = {
  [K in VisibleTraitName]?: {
    component: Component
    props: (data: TraitViews[K]) => Record<string, unknown> | null
  }
}

export const TRAIT_RENDERERS: TraitRendererMap = {
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
      pace: d.pace,
      counter: d.timer.counter
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
