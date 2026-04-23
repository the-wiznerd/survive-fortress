<template>
  <div class="inspector-view">
    <EntityCard
      v-if="player"
      :entity="player"
      :collapsible="false"
      class="player"
    />

    <div v-if="selection" class="selection">
      <div v-if="selection.entities.length === 0" class="stat">Empty</div>
      <EntityCard
        v-for="e in selection.entities"
        :key="e.id"
        :entity="e"
      />
    </div>

    <SidebarSettings
      :scale="scale"
      :turn-mode="turnMode"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @turn-mode-change="setTurnMode"
    />

    <DebugPanel v-if="debugEnabled" />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { ViewEntity } from '@repo/server/sdk'
  import { storeToRefs } from 'pinia'
  import EntityCard from '~client/components/EntityCard.vue'
  import DebugPanel from '~client/components/DebugPanel.vue'
  import SidebarSettings from '~client/components/SidebarSettings.vue'
  import { DEBUG_ENABLED } from '~client/utils/debug'
  import { useGameStore } from '~client/stores/game'

  const debugEnabled = DEBUG_ENABLED

  const gameStore = useGameStore()
  const { view, inspectedCell, inspectResult, scale, turnMode } = storeToRefs(gameStore)
  const setScale = (n: number) => gameStore.setScale(n)
  const setTurnMode = (mode: 'manual' | 'auto') => gameStore.setTurnMode(mode)

  const zoomIn = () => setScale(scale.value + 1)
  const zoomOut = () => setScale(scale.value - 1)

  const player = computed<ViewEntity | null>(() => {
    if (!view.value) return null
    return view.value.entities.find(e => String(e.id) === view.value!.playerId) ?? null
  })

  const selection = computed(() => {
    if (!inspectResult.value || !inspectedCell.value) return null
    const playerId = view.value?.playerId
    return {
      ...inspectedCell.value,
      entities: inspectResult.value.entities
        .filter(e => !e.traits.contained && String(e.id) !== playerId)
        .sort((a, b) => b.z - a.z),
    }
  })
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

  .player {
    border-block-start: 0 none;
  }

  .selection {
    padding-top: 2rem;
  }
</style>
