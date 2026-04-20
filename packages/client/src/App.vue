<template>
  <div id="game-container" :class="`phase-${phase}`">
    <canvas ref="canvasRef"></canvas>
  </div>
  <Sidebar />
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, provide, toRef } from 'vue'
  import type { GameView, ViewEntity, InspectResult, VisibleTraitName } from '@repo/server/sdk'
  import { ENTITY_TRAIT_NAMES } from '~client/entityTraits'
  import { settings } from '~client/settings'
  import { Renderer } from '~client/renderer'
  import { bindInput, getHoveredCell, getInspectedCell, setInputPhase } from '~client/input'
  import { init, getView, getGame, onPhaseChange, stopGame, type RoundPhase } from '~client/game'
  import { debugInit } from '~client/debug'
  import Sidebar from '~client/components/Sidebar.vue'

  const canvasRef = ref<HTMLCanvasElement | null>(null)

  // Reactive state for the sidebar.
  const view = ref<GameView | null>(null)
  const inspectedCell = ref<{ x: number; y: number } | null>(null)
  const inspectResult = ref<InspectResult | null>(null)
  const phase = ref<RoundPhase>('planning')
  const scale = toRef(settings, 'scale')

  let renderer: Renderer
  let rafId = 0

  provide('view', view)
  provide('inspectedCell', inspectedCell)
  provide('inspectResult', inspectResult)
  provide('scale', scale)
  provide('setScale', (newScale: number) => {
    const clamped = Math.max(1, Math.floor(newScale))
    scale.value = clamped
    renderer.setScale(clamped)
  })
  provide('turnMode', toRef(settings, 'turnMode'))
  provide('setTurnMode', async (mode: 'manual' | 'auto') => {
    settings.turnMode = mode
    stopGame()
    await startGame()
  })
  provide('getTraitNames', (entity: ViewEntity): VisibleTraitName[] => {
    return ENTITY_TRAIT_NAMES[entity.type] ?? []
  })

  let unbindInput: (() => void) | null = null

  onMounted(async () => {
    const canvas = canvasRef.value!
    renderer = new Renderer(canvas, 32, 24, settings.scale)
    debugInit(renderer)

    renderer.onReady = () => {
      if (view.value) renderer.render(view.value, getHoveredCell(), getInspectedCell())
    }

    onPhaseChange((nextPhase) => {
      phase.value = nextPhase
      setInputPhase(nextPhase)
      refreshUI()
    })

    unbindInput = bindInput(canvas, renderer, refreshUI, () => { startGame() })
    rafId = requestAnimationFrame(animationLoop)
    await startGame()
  })

  onUnmounted(() => {
    stopGame()
    if (rafId) cancelAnimationFrame(rafId)
    if (unbindInput) unbindInput()
  })

  async function startGame() {
    await init(renderer, refreshUI, settings.turnMode)
    refreshUI()
  }

  function refreshUI() {
    const v = getView()
    if (!v) return
    view.value = v
    const game = getGame()
    const cell = getInspectedCell()
    inspectedCell.value = cell
    inspectResult.value = cell ? game.inspect(cell.x, cell.y) : null
  }

  function animationLoop() {
    const v = getView()
    if (v) renderer.render(v, getHoveredCell(), getInspectedCell())
    rafId = requestAnimationFrame(animationLoop)
  }
</script>