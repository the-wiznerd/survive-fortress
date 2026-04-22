import { ref, onMounted, onBeforeUnmount, type Ref, type ShallowRef } from 'vue'
import { useGameStore } from '~client/stores/game'
import type { Renderer } from '~client/renderer'

/** Wire pointer input on a canvas: clicks update the store's inspected cell,
 *  hover updates the returned `hoveredCell` ref (a render-only concern). */
export function usePointerInput(
  canvas: Ref<HTMLCanvasElement | null>,
  renderer: ShallowRef<Renderer | null>,
): { hoveredCell: Ref<CellCoord | null> } {
  const game = useGameStore()
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

  const onClick = (e: MouseEvent) => { game.setInspectedCell(canvasToWorld(e)) }
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

  return { hoveredCell }
}
