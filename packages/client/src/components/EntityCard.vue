<script setup lang="ts">
import { computed, inject } from 'vue'
import type { ViewEntity } from '@repo/server/sdk'
import { TRAIT_RENDERERS } from '../traitRenderers'

const props = defineProps<{
  entity: ViewEntity
}>()

const getTraitNames = inject<(entity: ViewEntity) => string[]>('getTraitNames')!

const label = computed(() => {
  const e = props.entity
  return e.name ? `${e.name} (${e.type})` : e.type
})

const traits = computed(() => {
  const result: { name: string; component: any; props: Record<string, unknown> }[] = []
  for (const name of getTraitNames(props.entity)) {
    const renderer = TRAIT_RENDERERS[name]
    const data = props.entity.traits[name]
    if (!renderer || !data) continue
    const p = renderer.props(data)
    if (p) result.push({ name, component: renderer.component, props: p })
  }
  return result
})
</script>

<template>
  <div class="entity-card">
    <div class="entity-card-label">{{ label }}</div>
    <div v-if="traits.length" class="entity-card-traits">
      <component
        v-for="t in traits"
        :key="t.name"
        :is="t.component"
        v-bind="t.props"
      />
    </div>
  </div>
</template>

<style scoped>
.entity-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  padding: 8px 10px;
  margin-bottom: 8px;
}

.entity-card-label {
  color: #87ceeb;
  font-weight: bold;
  font-size: 13px;
  text-transform: capitalize;
}

.entity-card-traits:empty {
  display: none;
}

.entity-card-traits {
  margin-top: 4px;
}
</style>
