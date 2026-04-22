import { ref, onMounted, onBeforeUnmount, type Ref, type ShallowRef } from 'vue'
import { useGameStore } from '~client/stores/game'
import type { Renderer } from '~client/renderer'

export interface PointerInputState {
  inspectedCell: Ref<CellCoord | null>
  hoveredCell: Ref<CellCoord | null>
}

/** Wire pointer input on a canvas to inspector state. The returned refs drive UI. */
export function usePointerInput(
  canvas: Ref<HTMLCanvasElement | null>,
  renderer: ShallowRef<Renderer | null>,
  onSelect: () => void,
): PointerInputState {
  const game = useGameStore()
  const inspectedCell = ref<CellCoord | null>(null)
  const hoveredCell = ref<CellCoord | null>(null)

  function canvasToWorld(e: MouseEvent): CellCoord | null {
    const c = canvas.value, r = renderer.value
    if (!c || !r) return null
    const rect = c.getBoundingClientRect()
    const scaleX = c.width / rect.width
    const scaleY = c.height / rect.height
    return r.screenToWorld(
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY,
      game.view ?? undefined,
    )
  }

  const onClick = (e: MouseEvent) => {
    inspectedCell.value = canvasToWorld(e)
    onSelect()
  }
  const onMouseMove = (e: MouseEvent) => { hoveredCell.value = canvasToWorld(e) }
  const onMouseLeave = () => { hoveredCell.value = null }

  onMounted(() => {
    const c = canvas.value
    if (!c) return
    c.addEventListener('click', onClick)
    c.addEventListener('mousemove', onMouseMove)
    c.addEventListener('mouseleave', onMouseLeave)
  })

  onBeforeUnmount(() => {
    const c = canvas.value
    if (!c) return
    c.removeEventListener('click', onClick)
    c.removeEventListener('mousemove', onMouseMove)
    c.removeEventListener('mouseleave', onMouseLeave)
  })

  return { inspectedCell, hoveredCell }
}
