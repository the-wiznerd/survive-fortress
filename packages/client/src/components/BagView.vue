<template>
  <div class="bag-view">
    <header class="drawer-header">
      <button class="back" @click="popSidebarView">&larr; Back</button>
    </header>
    <InventoryPanel />
  </div>
</template>

<script setup lang="ts">
  import InventoryPanel from '~client/components/InventoryPanel.vue'
  import { popSidebarView } from '~client/utils/sidebarStack'
</script>

<style lang="scss" scoped>
  .bag-view {
    padding: pixel-sim-space(8) pixel-sim-space(6) pixel-sim-space(4);
    display: flex;
    flex-direction: column;
    min-height: 100%;
    box-sizing: border-box;
    background: var(--color-black);
  }

  .drawer-header {
    display: flex;
    align-items: center;
    margin-block-end: pixel-sim-space(4);
  }

  .back {
    background: var(--color-darkest-gray);
    color: inherit;
    border: 1px solid var(--color-dark-gray);
    font: inherit;
    padding: pixel-sim-space(1) pixel-sim-space(2);
    cursor: pointer;

    &:hover {
      background: var(--color-dark-gray);
    }
  }
</style>
