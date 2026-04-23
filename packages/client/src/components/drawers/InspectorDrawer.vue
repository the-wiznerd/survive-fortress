<template>
  <Drawer title="Inspecting" @close="onClose">
    <div v-if="!entities.length" class="stat empty">Empty</div>
    <EntityCard
      v-for="e in entities"
      :key="e.id"
      :entity="e"
      :start-open="true"
    />
  </Drawer>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import EntityCard from '~client/components/EntityCard.vue'
  import { useGameStore } from '~client/stores/game'
  import Drawer from '~client/components/drawers/Drawer.vue'

  const gameStore = useGameStore()
  const { view, inspectResult } = storeToRefs(gameStore)

  const entities = computed(() => {
    if (!inspectResult.value) return []
    const playerId = view.value?.playerId
    return inspectResult.value.entities
      .filter(e => !e.traits.contained && String(e.id) !== playerId)
      .sort((a, b) => b.z - a.z)
  })

  function onClose() {
    gameStore.setInspectedCell(null)
  }
</script>

<style lang="scss" scoped>

  .inspector-view {
    padding: pixel-sim-space(2) pixel-sim-space(6);
    display: flex;
    flex-direction: column;
    min-height: 100%;
    box-sizing: border-box;
    background: var(--color-black);
  }

  .drawer-header {
    display: flex;
    align-items: center;
    gap: pixel-sim-space(3);
    margin-block-end: pixel-sim-space(4);
  }

  .back {
    @include button-back-button
  }

  .position {
    color: var(--color-gray);
  }

  .empty {
    opacity: 0.6;
  }
</style>
