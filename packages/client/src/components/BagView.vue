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
  import { popSidebarView } from '~client/sidebarStack'
</script>

<style lang="scss" scoped>
  .bag-view {
    padding: 2rem 1.5rem 1rem;
    line-height: 1.5;
    display: flex;
    flex-direction: column;
    min-height: 100%;
    box-sizing: border-box;
    background: var(--color-black);
  }

  .drawer-header {
    display: flex;
    align-items: center;
    margin-block-end: 1rem;
  }

  .back {
    background: var(--color-darkest-gray);
    color: inherit;
    border: 1px solid var(--color-dark-gray);
    font: inherit;
    padding: 0.2em 0.6em;
    cursor: pointer;

    &:hover {
      background: var(--color-dark-gray);
    }
  }
</style>
