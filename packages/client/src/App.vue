<template>
  <div id="game-container" :class="`-${phase}`">
    <GameCanvas />
    <ToastOverlay />
  </div>
  <Sidebar />
</template>

<script setup lang="ts">
  import { onUnmounted } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useGameStore } from '~client/stores/game'
  import GameCanvas from '~client/components/GameCanvas.vue'
  import Sidebar from '~client/components/Sidebar.vue'
  import ToastOverlay from '~client/components/ToastOverlay.vue'

  const game = useGameStore()
  const { phase } = storeToRefs(game)

  onUnmounted(() => { game.stop() })
</script>

<style lang="scss" scoped>
  #game-container {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-sizing: border-box;
    position: relative;
  }
</style>