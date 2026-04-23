<template>
  <aside id="sidebar">
    <header class="sidebar-header">
      <div class="day">
        <span class="label">Day:</span> <span class="value">{{ day }}.{{ tickOfDay }}</span>
      </div>
      <PlanFeed />
    </header>
    <div class="drawer-area">
      <Transition :name="transitionName">
        <KeepAlive>
          <component
            :is="currentComponent"
            :key="topId"
            v-bind="currentProps"
            class="drawer"
          />
        </KeepAlive>
      </Transition>
    </div>
  </aside>
</template>

<script setup lang="ts">
  import { computed, watch } from 'vue'
  import { storeToRefs } from 'pinia'
  import { TICKS_PER_DAY } from '@repo/server/sdk'
  import PlayerView from '~client/components/PlayerView.vue'
  import InspectorView from '~client/components/InspectorView.vue'
  import ContainerView from '~client/components/ContainerView.vue'
  import PlanFeed from '~client/components/PlanFeed.vue'
  import {
    sidebarStack,
    sidebarTop,
    sidebarDirection,
    pushSidebarView,
    popToSidebarView,
  } from '~client/utils/sidebarStack'
  import { useGameStore } from '~client/stores/game'

  const stack = sidebarStack
  const topId = computed(() => stack.value[stack.value.length - 1]?.id ?? 0)
  const currentComponent = computed(() => {
    const top = sidebarTop.value
    if (!top) return PlayerView
    switch (top.kind) {
      case 'player': return PlayerView
      case 'inspector': return InspectorView
      case 'container': return ContainerView
    }
  })

  const currentProps = computed<Record<string, unknown>>(() => {
    const top = sidebarTop.value
    if (!top) return {}
    switch (top.kind) {
      case 'container': return { containerId: top.containerId }
      default: return {}
    }
  })

  const transitionName = computed(() =>
    sidebarDirection.value === 'push' ? 'drawer-push' : 'drawer-pop'
  )

  const { view, inspectedCell } = storeToRefs(useGameStore())
  const day = computed(() => view.value ? Math.floor(view.value.tick / TICKS_PER_DAY) + 1 : 0)
  const tickOfDay = computed(() =>
    view.value ? String(view.value.tick % TICKS_PER_DAY).padStart(2, '0') : '00'
  )

  // Inspected cell drives the inspector drawer: present → push (if not already shown),
  // cleared → pop back to the player drawer.
  watch(inspectedCell, cell => {
    const top = sidebarTop.value
    if (cell) {
      if (top?.kind !== 'inspector') pushSidebarView({ kind: 'inspector' })
    } else {
      if (top?.kind === 'inspector') popToSidebarView('player')
    }
  })
</script>

<style lang="scss" scoped>
  #sidebar {
    width: 500px;
    display: flex;
    flex-direction: column;
    background: var(--color-black);
    border-left: var(--border-width) solid var(--color-darkest-gray);
  }

  .sidebar-header {
    flex: 0 0 auto;
    padding-block-start: pixel-sim-space(5);
    display: flex;
    flex-direction: column;
    gap: pixel-sim-space(4);
  }

  .day {
    @include ts-heading-secondary;

    padding-inline: pixel-sim-space(5);

    .value {
      color: var(--color-white);
    }
  }

  .drawer-area {
    flex: 1 1 auto;
    position: relative;
    overflow: hidden;
  }

  .drawer {
    position: absolute;
    inset: 0;
    overflow-y: auto;
    scrollbar-gutter: stable;
  }

  .drawer-push-enter-active,
  .drawer-pop-leave-active {
    transition: transform 0.2s ease;
    z-index: 1;
  }

  .drawer-push-enter-from { 
    transform: translateX(100%);
  }

  .drawer-pop-leave-to    {
    transform: translateX(100%);
  }
</style>