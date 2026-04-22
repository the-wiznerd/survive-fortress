<template>
  <aside id="sidebar">
    <Transition :name="transitionName">
      <component :is="currentComponent" :key="stack.length" class="drawer" />
    </Transition>
  </aside>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import InspectorView from '~client/components/InspectorView.vue'
  import BagView from '~client/components/BagView.vue'
  import { sidebarStack, sidebarTop, sidebarDirection } from '~client/sidebarStack'

  const stack = sidebarStack
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

  // Push: new view slides in from the right; old slides out to the left.
  .drawer-push-enter-active,
  .drawer-push-leave-active,
  .drawer-pop-enter-active,
  .drawer-pop-leave-active {
    transition: transform 0.2s ease;
  }
  .drawer-push-enter-from { transform: translateX(100%); }
  .drawer-push-leave-to   { transform: translateX(-100%); }
  // Pop: reverse direction.
  .drawer-pop-enter-from  { transform: translateX(-100%); }
  .drawer-pop-leave-to    { transform: translateX(100%); }
</style>