<template>
  <aside id="sidebar">
    <header class="sidebar-header">
      <div class="day"><span class="label">Day:</span> {{ day }}.{{ tickOfDay }}</div>
      <PlanFeed />
    </header>
    <div class="drawer-area">
      <Transition :name="transitionName">
        <KeepAlive>
          <component :is="currentComponent" :key="topId" class="drawer" />
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
  import BagView from '~client/components/BagView.vue'
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
      case 'bag': return BagView
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
    width: 330px;
    display: flex;
    flex-direction: column;
    background: var(--color-black);
    border-left: 1px solid var(--color-darkest-gray);
  }

  .sidebar-header {
    flex: 0 0 auto;
    padding: 1rem 1.5rem 1.5rem;
    border-block-end: 1px solid var(--color-darkest-gray);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .day {
    font-size: 1rem;
    font-weight: bold;

    .label {
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
  }

  // Push: new view slides in from the right and covers the previous drawer
  // (which stays in place underneath, preserving its scroll/expand state).
  // Pop: top view slides off to the right, revealing the drawer beneath.
  .drawer-push-enter-active,
  .drawer-pop-leave-active {
    transition: transform 0.2s ease;
    z-index: 1;
  }
  .drawer-push-enter-from { transform: translateX(100%); }
  .drawer-pop-leave-to    { transform: translateX(100%); }
</style>