import type { PlayerAction } from '@repo/server/sdk'
import type { Renderer } from '~client/renderer'

// ─── Move Queue ───

export interface MoveStep { dx: number; dy: number }

let moveQueue: MoveStep[] = []
let spaceHeld = false
let arrowDuringSpace = false
let onQueueChange: ((front: MoveStep | null) => void) | null = null

/** Register callback fired when the queue front changes. */
export function setOnQueueChange(cb: (front: MoveStep | null) => void) {
  onQueueChange = cb
}

/** Read the current queue (for arrow rendering). */
export function getMoveQueue(): readonly Readonly<MoveStep>[] {
  return moveQueue
}

/** Shift the front off the queue (called when a move is confirmed). */
export function advanceQueue() {
  if (moveQueue.length === 0) return
  moveQueue.shift()
  onQueueChange?.(moveQueue[0] ?? null)
}

function setQueue(queue: MoveStep[]) {
  moveQueue = queue
  onQueueChange?.(moveQueue[0] ?? null)
}

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

    let step: MoveStep | null = null
    switch (e.key) {
      case 'ArrowUp': step = { dx: 0, dy: -1 }; break
      case 'ArrowDown': step = { dx: 0, dy: 1 }; break
      case 'ArrowLeft': step = { dx: -1, dy: 0 }; break
      case 'ArrowRight': step = { dx: 1, dy: 0 }; break
      case ' ':
        spaceHeld = true
        arrowDuringSpace = false
        return
      case 'r': case 'R': onReload(); return
    }

    if (step) {
      if (spaceHeld) {
        const wasEmpty = moveQueue.length === 0
        moveQueue.push(step)
        arrowDuringSpace = true
        if (wasEmpty) onQueueChange?.(step)
      } else {
        setQueue([step])
      }
    }
  }

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === ' ') {
      if (!arrowDuringSpace) {
        setQueue([])
      }
      spaceHeld = false
    }
  }

  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)

  return () => {
    canvas.removeEventListener('click', onClick)
    canvas.removeEventListener('mousemove', onMouseMove)
    canvas.removeEventListener('mouseleave', onMouseLeave)
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('keyup', onKeyUp)
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
