<template>
  <div class="inspector-view">
    <header class="drawer-header">
      <button class="back" @click="close">&lt; Back</button>
      <span class="position" v-if="inspectedCell">
        ({{ inspectedCell.x }}, {{ inspectedCell.y }})
      </span>
    </header>

    <div v-if="!entities.length" class="stat empty">Empty</div>
    <EntityCard
      v-for="e in entities"
      :key="e.id"
      :entity="e"
      :start-open="true"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import EntityCard from '~client/components/EntityCard.vue'
  import { useGameStore } from '~client/stores/game'

  const gameStore = useGameStore()
  const { view, inspectedCell, inspectResult } = storeToRefs(gameStore)

  const entities = computed(() => {
    if (!inspectResult.value) return []
    const playerId = view.value?.playerId
    return inspectResult.value.entities
      .filter(e => !e.traits.contained && String(e.id) !== playerId)
      .sort((a, b) => b.z - a.z)
  })

  function close() {
    gameStore.setInspectedCell(null)
  }
</script>

<style lang="scss" scoped>
  .inspector-view {
    padding: 0.5rem 1.5rem;
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
    gap: 0.75rem;
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

  .position {
    color: var(--color-gray);
    font-size: 0.875rem;
  }

  .empty {
    opacity: 0.6;
  }
</style>
