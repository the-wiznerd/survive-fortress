import type { Renderer } from '~client/renderer'
import { appendMove, clearPlan, submitPlan, getPlan, type RoundPhase } from '~client/game'

// ─── Inspector State ───

let inspectedCell: { x: number; y: number } | null = null
let hoveredCell: { x: number; y: number } | null = null

export function getInspectedCell() { return inspectedCell }
export function getHoveredCell() { return hoveredCell }

// ─── Binding ───

let currentPhase: RoundPhase = 'planning'

export function setInputPhase(phase: RoundPhase) {
  currentPhase = phase
}

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
    if (currentPhase !== 'planning') return

    switch (e.key) {
      case 'ArrowUp': appendMove(0, -1); break
      case 'ArrowDown': appendMove(0, 1); break
      case 'ArrowLeft': appendMove(-1, 0); break
      case 'ArrowRight': appendMove(1, 0); break
      case 'Backspace': clearPlan(); break
      case 'Enter': submitPlan(); break
    }
  }

  document.addEventListener('keydown', onKeyDown)

  return () => {
    canvas.removeEventListener('click', onClick)
    canvas.removeEventListener('mousemove', onMouseMove)
    canvas.removeEventListener('mouseleave', onMouseLeave)
    document.removeEventListener('keydown', onKeyDown)
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
  )
}
