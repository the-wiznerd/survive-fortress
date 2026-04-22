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

  // The canvas owns inspector selection: the user picks a cell here, the rest of
  // the app reads it. `hoveredCell` is purely a render concern, so it stays internal.
  const inspectedCell = defineModel<CellCoord | null>('inspectedCell', { default: null })
  const emit = defineEmits<{ select: [] }>()

  const game = useGameStore()
  const { view, scale } = storeToRefs(game)

  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const rendererRef = shallowRef<Renderer | null>(null)

  const { inspectedCell: pointerInspected, hoveredCell } = usePointerInput(
    canvasRef,
    rendererRef,
    () => emit('select'),
  )

  // Keep the model in sync with the pointer composable's internal ref.
  // (The composable predates v-model; we adapt at the boundary instead of refactoring it.)
  watch(pointerInspected, (cell) => { inspectedCell.value = cell })

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
    emit('select')
  })

  useAnimationFrame(() => {
    const r = rendererRef.value
    const v = view.value
    if (r && v) r.render(v, hoveredCell.value, inspectedCell.value)
  })
</script>
