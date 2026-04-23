<template>
  <details v-if="collapsible" :open="startOpen" class="disclosure">
    <summary>
      <span class="label"><slot name="label">{{  label }}</slot></span>
      <span class="toggle"></span>
    </summary>
    <div class="content">
      <slot />
    </div>
  </details>
  <section v-else class="disclosure">
    <header>
      <h3 class="label"><slot name="label">{{  label }}</slot></h3>
    </header>
    <div v-if="!isEmpty" class="content">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed, useSlots, Comment, Text } from 'vue'
  import type { VNode } from 'vue'

  withDefaults(defineProps<{
    label?: string
    collapsible?: boolean
    startOpen?: boolean
  }>(), {
    collapsible: true,
    startOpen: false
  })

  const slots = useSlots()

  const isEmpty = computed(() => !hasMeaningfulContent(slots.default?.()))

  function hasMeaningfulContent(nodes: VNode[] | undefined): boolean {
    if (!nodes) return false
    return nodes.some(n => {
      if (n.type === Comment) return false
      if (n.type === Text && typeof n.children === 'string' && n.children.trim() === '') return false
      if (Array.isArray(n.children) && n.children.length === 0) return false
      return true
    })
  }
</script>

<style lang="scss" scoped>

  .disclosure {
    border-block-start: var(--border-width) solid var(--color-darkest-gray);

    header,
    summary {
      justify-content: space-between;
      align-items: center;
      padding: pixel-sim-space(4) 0;

      .label {
        @include ts-heading-secondary;
        margin-block: 0;
      }
    }

    summary {
      cursor: pointer;
      display: flex;

      &::marker,
      &::-webkit-details-marker {
        display: none;
      }

      .toggle {
        background: var(--color-darkest-gray);
        color: var(--color-lightest-gray);
        font-family: var(--font-mono);
        height: pixel-sim-space(5);
        width: pixel-sim-space(5);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;        
        user-select: none;        
        position: relative;
        inset-block-start: -1px;

        &::after {
          content: '+';        
          display: inline-block;
          position: relative;
          inset-block-start: 1px;

        }
      }

      &:hover .toggle {
        background: var(--color-dark-gray);
      }
    }

    &[open] summary .toggle::after {
      content: '-';
    }

    .content {
      padding-block: 0 pixel-sim-space(4);
      display: flex;
      flex-direction: column;
      gap: pixel-sim-space(4);
    }
  }

  details::details-content {
    display: block;
    overflow: clip;
    transition: height 0.25s ease, content-visibility 0.25s ease allow-discrete;
    height: 0;
  }

  details[open]::details-content {
    height: auto;
  }
</style>