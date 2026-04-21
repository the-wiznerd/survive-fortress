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
  import { computed, inject, type Component } from 'vue'
  import type { ViewEntity, VisibleTraitName } from '@repo/server/sdk'
  import { renderTrait } from '../traitRenderers'
  import { showPositionTraits } from '~client/debug'

  const props = defineProps<{
    entity: ViewEntity
  }>()

  const getTraitNames = inject<(entity: ViewEntity) => VisibleTraitName[]>('getTraitNames')!

  const label = computed(() => {
    const e = props.entity
    return e.name ? `${e.name} (${e.type})` : e.type
  })

  const traits = computed(() => {
    const result: { name: string; component: Component; props: Record<string, unknown> }[] = []
    for (const name of getTraitNames(props.entity)) {
      if (name === 'position' && !showPositionTraits.value) continue
      const data = props.entity.traits[name]
      if (!data) continue
      const rendered = renderTrait(name, data)
      if (rendered) result.push({ name, ...rendered })
    }
    return result
  })
</script>

<style lang="scss" scoped>
  @use '~styles/mixins';

  .entity-card {

    >.label {
      @include mixins.heading;
    }

    .traits {
      display: flex;
      flex-direction: column;
      gap: 1em;
    }
  }
</style>