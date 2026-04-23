import { ref, onMounted, onBeforeUnmount, type Ref, type ShallowRef } from 'vue'
import { useGameStore } from '~client/stores/game'
import type { Renderer } from '~client/renderer'

/** Wire pointer input on a canvas:
 *  - **Left-click** inspects the cell (sets the store's inspectedCell).
 *  - **Right-click / long-press** appends a path of moves to that cell during
 *    planning. The browser fires `contextmenu` for both mouse right-click and
 *    touch long-press, so we suppress its default and treat it as the move
 *    gesture.
 *
 *  The two gestures are independent: inspect doesn't touch the plan, and move
 *  doesn't touch the inspector.
 *
 *  Hover updates the returned `hoveredCell` ref (a render-only concern). */
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

  const onClick = (e: MouseEvent) => {
    if (e.button !== 0) return
    game.setInspectedCell(canvasToWorld(e))
  }
  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    if (game.phase !== 'planning') return
    const cell = canvasToWorld(e)
    if (!cell) return
    game.appendPathTo(cell.x, cell.y)
  }
  const onMouseMove = (e: MouseEvent) => { hoveredCell.value = canvasToWorld(e) }
  const onMouseLeave = () => { hoveredCell.value = null }

  onMounted(() => {
    const c = canvas.value
    if (!c) return
    c.addEventListener('click', onClick)
    c.addEventListener('contextmenu', onContextMenu)
    c.addEventListener('mousemove', onMouseMove)
    c.addEventListener('mouseleave', onMouseLeave)
  })

  onBeforeUnmount(() => {
    const c = canvas.value
    if (!c) return
    c.removeEventListener('click', onClick)
    c.removeEventListener('contextmenu', onContextMenu)
    c.removeEventListener('mousemove', onMouseMove)
    c.removeEventListener('mouseleave', onMouseLeave)
  })

  return { hoveredCell }
}
