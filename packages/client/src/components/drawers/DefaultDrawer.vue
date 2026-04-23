<template>
  <div class="default-drawer">
    <EntityCard
      v-if="player"
      :entity="player"
      :collapsible="false"
      class="player"
    />

    <Settings
      :scale="scale"
      :turn-mode="turnMode"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @turn-mode-change="setTurnMode"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { ViewEntity } from '@repo/server/sdk'
  import { storeToRefs } from 'pinia'
  import EntityCard from '~client/components/EntityCard.vue'
  import Settings from '~client/components/Settings.vue'
  import { useGameStore } from '~client/stores/game'

  const gameStore = useGameStore()
  const { view, scale, turnMode } = storeToRefs(gameStore)
  const setScale = (n: number) => gameStore.setScale(n)
  const setTurnMode = (mode: 'manual' | 'auto') => gameStore.setTurnMode(mode)

  const zoomIn = () => setScale(scale.value + 1)
  const zoomOut = () => setScale(scale.value - 1)

  const player = computed<ViewEntity | null>(() => {
    if (!view.value) return null
    return view.value.entities.find(e => String(e.id) === view.value!.playerId) ?? null
  })
</script>

<style lang="scss" scoped>
  .default-drawer {
    padding: pixel-sim-space(3) pixel-sim-space(6) pixel-sim-space(2);
    display: flex;
    flex-direction: column;
    min-height: 100%;
    box-sizing: border-box;
    background: var(--color-black);
  }

  .player {
    border-block-start: 0 none;
  }
</style>
