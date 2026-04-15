<template>
  <div class="entity-card section">
    <h2 class="label">{{ label }}</h2>
    <div v-if="traits.length" class="traits">
      <component
        v-for="t in traits"
        :key="t.name"
        :is="t.component"
        v-bind="t.props"
      />
    </div>
  </div>
</template>

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