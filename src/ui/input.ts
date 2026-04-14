import { Renderer } from './renderer.js'

// ─── State ───

let pendingInput: Action | null = null
let inspectedCell: { x: number; y: number } | null = null
let hoveredCell: { x: number; y: number } | null = null

export function getPendingInput(): Action | null {
  const input = pendingInput
  pendingInput = null
  return input
}
export function getInspectedCell() { return inspectedCell }
export function getHoveredCell() { return hoveredCell }

// ─── Binding ───

export function bindInput(canvas: HTMLCanvasElement, renderer: Renderer, onSelect: () => void, onReload: () => void) {
  canvas.addEventListener('click', (e) => {
    inspectedCell = canvasToWorld(e, canvas, renderer)
    onSelect()
  })

  canvas.addEventListener('mousemove', (e) => {
    hoveredCell = canvasToWorld(e, canvas, renderer)
  })

  canvas.addEventListener('mouseleave', () => {
    hoveredCell = null
  })

  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowUp': pendingInput = { type: 'move', dx: 0, dy: -1 }; break
      case 'ArrowDown': pendingInput = { type: 'move', dx: 0, dy: 1 }; break
      case 'ArrowLeft': pendingInput = { type: 'move', dx: -1, dy: 0 }; break
      case 'ArrowRight': pendingInput = { type: 'move', dx: 1, dy: 0 }; break
      case ' ': pendingInput = { type: 'wait' }; break
      case 'r': case 'R': onReload(); break
    }
  })
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
