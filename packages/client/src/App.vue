<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from 'vue'
import type { GameView, ViewEntity, InspectResult } from '@repo/server/sdk'
import Sidebar from './components/Sidebar.vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

// Reactive state for the sidebar.
const view = ref<GameView | null>(null)
const inspectedCell = ref<{ x: number; y: number } | null>(null)
const inspectResult = ref<InspectResult | null>(null)

let renderer: Renderer
let rafId = 0

provide('view', view)
provide('inspectedCell', inspectedCell)
provide('inspectResult', inspectResult)
provide('getTraitNames', (entity: ViewEntity) => {
  const er = renderer?.getEntityRenderer(entity.type)
  return er ? er.describeTraits(entity) : []
})

onMounted(async () => {
  const canvas = canvasRef.value!
  renderer = new Renderer(canvas, 32, 24, 3)

  renderer.onReady = () => {
    if (view.value) renderer.render(view.value, getHoveredCell(), getInspectedCell())
  }

  bindInput(canvas, renderer, refreshUI, () => { startGame() })
  rafId = requestAnimationFrame(animationLoop)
  await startGame()
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
})

async function startGame() {
  await init(renderer)
  startTickLoop(renderer, getPendingInput, refreshUI)
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

<template>
  <div id="game-container">
    <canvas ref="canvasRef"></canvas>
  </div>
  <Sidebar />
</template>
