<template>
  <div id="game-container" :class="`phase-${phase}`">
    <GameCanvas />
    <PlanFeed />
  </div>
  <Sidebar />
</template>

<script setup lang="ts">
  import { onUnmounted } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useGameStore } from '~client/stores/game'
  import { useKeyboardInput } from '~client/composables/useKeyboardInput'
  import GameCanvas from '~client/components/GameCanvas.vue'
  import Sidebar from '~client/components/Sidebar.vue'
  import PlanFeed from '~client/components/PlanFeed.vue'

  const game = useGameStore()
  const { phase } = storeToRefs(game)

  useKeyboardInput()

  onUnmounted(() => { game.stop() })
</script>
