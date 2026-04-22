<template>
  <Disclosure 
    class="entity-card" 
    :collapsible="collapsible && traits.length > 0" 
    :start-open="startOpen"
    :label="label"
  >
    <div v-if="traits.length" class="traits">
      <component
        v-for="t in traits"
        :key="t.name"
        :is="t.component"
        v-bind="t.props"
      />
    </div>
  </Disclosure>
</template>

<script setup lang="ts">
  import { computed, type Component } from 'vue'
  import type { ViewEntity } from '@repo/server/sdk'
  import { renderTrait } from '~client/utils/traits/renderers'
  import { ENTITY_TRAIT_NAMES } from '~client/utils/traits/entities'
  import { showPositionTraits } from '~client/utils/debug'
  import Disclosure from './Disclosure.vue'

  const props = withDefaults(defineProps<{
    entity: ViewEntity
    label?: string
    collapsible?: boolean
    startOpen?: boolean
  }>(), {
    collapsible: true,
    startOpen: false
  })

  const label = computed(() => {
    const e = props.entity
    return e.name ? `${e.name} (${e.type})` : e.type
  })

  const traits = computed(() => {
    const result: { name: string; component: Component; props: Record<string, unknown> }[] = []
    for (const name of ENTITY_TRAIT_NAMES[props.entity.type] ?? []) {
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

  .traits {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
</style>