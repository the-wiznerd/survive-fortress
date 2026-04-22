<template>
  <aside id="sidebar">
    <Transition :name="transitionName">
      <KeepAlive>
        <component :is="currentComponent" :key="topId" class="drawer" />
      </KeepAlive>
    </Transition>
  </aside>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import InspectorView from '~client/components/InspectorView.vue'
  import BagView from '~client/components/BagView.vue'
  import { sidebarStack, sidebarTop, sidebarDirection } from '~client/sidebarStack'

  const stack = sidebarStack
  const topId = computed(() => stack.value[stack.value.length - 1]?.id ?? 0)
  const currentComponent = computed(() => {
    const top = sidebarTop.value
    if (!top) return InspectorView
    switch (top.kind) {
      case 'inspector': return InspectorView
      case 'bag': return BagView
    }
  })

  const transitionName = computed(() =>
    sidebarDirection.value === 'push' ? 'drawer-push' : 'drawer-pop'
  )
</script>

<style lang="scss" scoped>
  #sidebar {
    width: 300px;
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