import type { Renderer } from '~client/renderer'
import { appendMove, appendHarvest, clearPlan, submitPlan, getPlanCursor, gameState, view } from '~client/game'

// ─── Inspector State ───

let inspectedCell: { x: number; y: number } | null = null
let hoveredCell: { x: number; y: number } | null = null

export function getInspectedCell() { return inspectedCell }
export function getHoveredCell() { return hoveredCell }

// ─── Binding ───

export function bindInput(canvas: HTMLCanvasElement, renderer: Renderer, onSelect: () => void, onReload: () => void): () => void {
  const onClick = (e: MouseEvent) => {
    inspectedCell = canvasToWorld(e, canvas, renderer)
    onSelect()
  }

  const onMouseMove = (e: MouseEvent) => {
    hoveredCell = canvasToWorld(e, canvas, renderer)
  }

  const onMouseLeave = () => {
    hoveredCell = null
  }

  canvas.addEventListener('click', onClick)
  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mouseleave', onMouseLeave)

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return

    // Reload shortcut always works.
    if (e.key === 'r' || e.key === 'R') {
      onReload()
      return
    }

    // Plan-building only works in planning phase.
    if (gameState.phase !== 'planning') return

    let dx = 0
    let dy = 0
    switch (e.key) {
      case 'w': case 'W': dy = -1; break
      case 's': case 'S': dy = 1; break
      case 'a': case 'A': dx = -1; break
      case 'd': case 'D': dx = 1; break
      case 'Backspace': clearPlan(); return
      case ' ': submitPlan(); return
      default: return
    }

    e.preventDefault()
    handleDirectional(dx, dy)
  }

  document.addEventListener('keydown', onKeyDown)

  return () => {
    canvas.removeEventListener('click', onClick)
    canvas.removeEventListener('mousemove', onMouseMove)
    canvas.removeEventListener('mouseleave', onMouseLeave)
    document.removeEventListener('keydown', onKeyDown)
  }
}

// ─── Directional Action ───

function handleDirectional(dx: number, dy: number) {
  const cursor = getPlanCursor()
  if (!cursor) { appendMove(dx, dy); return }

  const v = view.value
  if (!v) { appendMove(dx, dy); return }

  const tx = cursor.x + dx
  const ty = cursor.y + dy

  // Check if there's a harvestable entity at the target cell.
  const target = v.entities.find(e =>
    e.x === tx && e.y === ty &&
    (e.traits.harvestable as { available: boolean } | undefined)?.available === true
  )

  if (target) {
    appendHarvest(target.id)
  } else {
    appendMove(dx, dy)
  }
}

// ─── Helpers ───

function canvasToWorld(e: MouseEvent, canvas: HTMLCanvasElement, renderer: Renderer): { x: number; y: number } | null {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return renderer.screenToWorld(
    (e.clientX - rect.left) * scaleX,
    (e.clientY - rect.top) * scaleY,
    view.value ?? undefined,
  )
}
