<template>
  <Disclosure 
    class="entity-card" 
    :class="{ flashing }"
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
  import { useEntityFlash } from '~client/composables/useFlash'
  import Disclosure from '~client/components/Disclosure.vue'

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
    if (props.label) return props.label
    const e = props.entity
    return e.name ? `${e.name} (${e.type})` : e.type
  })

  const flashing = useEntityFlash(() => props.entity.id)

  const traits = computed(() => {
    const result: { name: string; component: Component; props: Record<string, unknown> }[] = []
    for (const name of ENTITY_TRAIT_NAMES[props.entity.type] ?? []) {
      if (name === 'position' && !showPositionTraits.value) continue
      const data = props.entity.traits[name]
      if (!data) continue
      const rendered = renderTrait(name, data, props.entity)
      if (rendered) result.push({ name, ...rendered })
    }
    return result
  })
</script>

<style lang="scss" scoped>
  .entity-card {
    transition: background-color 0.2s ease, box-shadow 0.2s ease;

    &.flashing {
      animation: entity-flash 0.6s ease-out 2;
    }
  }

  @keyframes entity-flash {
    0%   { background-color: transparent; box-shadow: none; }
    30%  {
      background-color: var(--color-darkest-green);
      box-shadow: inset 0 0 0 var(--border-width) var(--color-light-green);
    }
    100% { background-color: transparent; box-shadow: none; }
  }

  .traits {
    display: flex;
    flex-direction: column;
    gap: pixel-sim-space(4);
  }
</style>