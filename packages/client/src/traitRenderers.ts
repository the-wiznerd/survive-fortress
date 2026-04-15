import type { Component } from 'vue'
import StatText from './components/traits/StatText.vue'
import MovementBar from './components/traits/MovementBar.vue'

export interface TraitRenderer {
  component: Component
  props: (data: Record<string, unknown>) => Record<string, unknown> | null
}

export const TRAIT_RENDERERS: Record<string, TraitRenderer> = {
  health: { component: StatText, props: d => ({ label: 'Health', value: `${d.current}/${d.max}` }) },
  hunger: { component: StatText, props: d => ({ label: 'Hunger', value: `${d.current}/${d.max}` }) },
  movement: { component: MovementBar, props: d => ({ pace: d.pace, counter: (d.timer as any)?.counter ?? 0 }) },
  moisture: { component: StatText, props: d => ({ label: 'Moisture', value: `${d.current}/${d.capacity}` }) },
  groundCover: { component: StatText, props: d => d.cover ? { label: 'Ground Cover', value: String(d.cover) } : null },
}
