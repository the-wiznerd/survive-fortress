<template>
  <canvas ref="canvasRef"></canvas>
</template>

<script setup lang="ts">
  import { ref, shallowRef, onMounted, watch } from 'vue'
  import { storeToRefs } from 'pinia'
  import { Renderer } from '~client/renderer'
  import { useGameStore } from '~client/stores/game'
  import { useAnimationFrame } from '~client/composables/useAnimationFrame'
  import { usePointerInput } from '~client/composables/usePointerInput'
  import { debugInit } from '~client/utils/debug'

  const game = useGameStore()
  const { view, scale, inspectedCell } = storeToRefs(game)

  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const rendererRef = shallowRef<Renderer | null>(null)

  // `hoveredCell` is purely a render concern; click selection lives in the store.
  const { hoveredCell } = usePointerInput(canvasRef, rendererRef)

  onMounted(async () => {
    const canvas = canvasRef.value!
    const renderer = new Renderer(canvas, 32, 24, scale.value)
    rendererRef.value = renderer
    debugInit(renderer)

    renderer.onReady = () => {
      if (view.value) renderer.render(view.value, hoveredCell.value, inspectedCell.value)
    }

    // Push scale changes from the store into the renderer.
    watch(scale, (n) => renderer.setScale(n))

    // The store needs a camera-move callback; the renderer is the natural owner.
    await game.init((x, y, z) => renderer.setCamera(x, y, z))
  })

  useAnimationFrame(() => {
    const r = rendererRef.value
    const v = view.value
    if (r && v) r.render(v, hoveredCell.value, inspectedCell.value)
  })
</script>

<style lang="scss" scoped>
  canvas {
    image-rendering: pixelated;
    flex-shrink: 0;
    max-inline-size: none;
  }
</style>