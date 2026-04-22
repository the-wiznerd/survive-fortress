<template>
  <div id="game-container" :class="`phase-${phase}`">
    <GameCanvas v-model:inspectedCell="inspectedCell" @select="refreshInspector" />
    <PlanFeed />
  </div>
  <Sidebar />
</template>

<script setup lang="ts">
  import { ref, onUnmounted, provide, watch } from 'vue'
  import { storeToRefs } from 'pinia'
  import type { ViewEntity, InspectResult, VisibleTraitName } from '@repo/server/sdk'
  import { ENTITY_TRAIT_NAMES } from '~client/utils/traits/entities'
  import { useGameStore } from '~client/stores/game'
  import { useKeyboardInput } from '~client/composables/useKeyboardInput'
  import GameCanvas from '~client/components/GameCanvas.vue'
  import Sidebar from '~client/components/Sidebar.vue'
  import PlanFeed from '~client/components/PlanFeed.vue'

  const game = useGameStore()
  const { view, phase } = storeToRefs(game)

  const inspectedCell = ref<CellCoord | null>(null)
  const inspectResult = ref<InspectResult | null>(null)

  useKeyboardInput()

  provide('view', view)
  provide('inspectedCell', inspectedCell)
  provide('inspectResult', inspectResult)
  provide('getTraitNames', (entity: ViewEntity): VisibleTraitName[] => {
    return ENTITY_TRAIT_NAMES[entity.type] ?? []
  })

  onUnmounted(() => { game.stop() })

  function refreshInspector() {
    const cell = inspectedCell.value
    inspectResult.value = cell ? game.getGame().inspect(cell.x, cell.y) : null
  }

  // Re-fetch inspector data whenever the phase changes (so harvested entities update).
  watch(phase, refreshInspector)
</script>
