<template>
  <div id="game-container" :class="`phase-${phase}`">
    <canvas ref="canvasRef"></canvas>
    <PlanFeed />
  </div>
  <Sidebar />
</template>

<script setup lang="ts">
  import { ref, shallowRef, onMounted, onUnmounted, provide, toRef, watch } from 'vue'
  import { storeToRefs } from 'pinia'
  import type { ViewEntity, InspectResult, VisibleTraitName } from '@repo/server/sdk'
  import { ENTITY_TRAIT_NAMES } from '~client/utils/traits/entities'
  import { settings } from '~client/settings'
  import { Renderer } from '~client/renderer'
  import { useGameStore } from '~client/stores/game'
  import { useAnimationFrame } from '~client/composables/useAnimationFrame'
  import { useKeyboardInput } from '~client/composables/useKeyboardInput'
  import { usePointerInput } from '~client/composables/usePointerInput'
  import { debugInit } from '~client/utils/debug'
  import Sidebar from '~client/components/Sidebar.vue'
  import PlanFeed from '~client/components/PlanFeed.vue'

  const game = useGameStore()
  const { view, phase } = storeToRefs(game)

  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const rendererRef = shallowRef<Renderer | null>(null)

  const inspectResult = ref<InspectResult | null>(null)
  const scale = toRef(settings, 'scale')

  const { inspectedCell, hoveredCell } = usePointerInput(canvasRef, rendererRef, refreshInspector)
  useKeyboardInput(() => { startGame() })

  provide('view', view)
  provide('inspectedCell', inspectedCell)
  provide('inspectResult', inspectResult)
  provide('scale', scale)
  provide('setScale', (newScale: number) => {
    const clamped = Math.max(1, Math.floor(newScale))
    scale.value = clamped
    rendererRef.value?.setScale(clamped)
  })
  provide('turnMode', toRef(settings, 'turnMode'))
  provide('setTurnMode', async (mode: 'manual' | 'auto') => {
    settings.turnMode = mode
    game.stop()
    await startGame()
  })
  provide('getTraitNames', (entity: ViewEntity): VisibleTraitName[] => {
    return ENTITY_TRAIT_NAMES[entity.type] ?? []
  })

  onMounted(async () => {
    const canvas = canvasRef.value!
    const renderer = new Renderer(canvas, 32, 24, settings.scale)
    rendererRef.value = renderer
    debugInit(renderer)

    renderer.onReady = () => {
      if (view.value) renderer.render(view.value, hoveredCell.value, inspectedCell.value)
    }

    await startGame()
  })

  onUnmounted(() => { game.stop() })

  useAnimationFrame(() => {
    const r = rendererRef.value
    const v = view.value
    if (r && v) r.render(v, hoveredCell.value, inspectedCell.value)
  })

  async function startGame() {
    const renderer = rendererRef.value!
    await game.init(settings.turnMode, (x, y, z) => renderer.setCamera(x, y, z))
    refreshInspector()
  }

  function refreshInspector() {
    const cell = inspectedCell.value
    inspectResult.value = cell ? game.getGame().inspect(cell.x, cell.y) : null
  }

  // Re-fetch inspector data whenever the phase changes (so harvested entities update).
  watch(phase, refreshInspector)
</script>
</script>