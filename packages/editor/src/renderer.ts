import { EDITOR_SPRITES } from './rendering/entities'
import { CELL_W, CELL_H } from './rendering/types'

export class EditorRenderer {
  private ctx: CanvasRenderingContext2D
  private spriteSheet: HTMLImageElement
  private spriteReady = false

  /** Scaled pixel width of one tile. */
  private destW: number
  /** Scaled row-advance (face height). */
  private rowStep: number

  onReady: (() => void) | null = null

  constructor(
    private canvas: HTMLCanvasElement,
    private viewWidth: number,
    private viewHeight: number,
    private scale: number,
  ) {
    this.ctx = canvas.getContext('2d')!
    this.ctx.imageSmoothingEnabled = false
    this.destW = CELL_W * scale
    this.rowStep = CELL_H * scale
    canvas.width = viewWidth * this.destW
    canvas.height = viewHeight * this.rowStep

    this.spriteSheet = new Image()
    this.spriteSheet.src = '/sprites/sprites.png'
    this.spriteSheet.onload = () => {
      this.spriteReady = true
      this.onReady?.()
    }
  }

  setCamera(x: number, y: number) {
    this.cameraX = x
    this.cameraY = y
  }

  private cameraX = 0
  private cameraY = 0

  /** Convert canvas pixel coords to world (x, y) at the given z-level. */
  screenToWorld(canvasX: number, canvasY: number, z: number): { x: number; y: number } {
    const sx = canvasX / this.destW
    const sy = canvasY / this.rowStep
    return {
      x: Math.floor(this.cameraX + sx),
      y: Math.floor(this.cameraY + sy + z),
    }
  }

  render(
    entities: { type: string; x: number; y: number; z: number }[],
    activeZ: number,
    hoveredCell: { x: number; y: number } | null,
  ) {
    if (!this.spriteReady) return

    const { ctx, canvas, scale, cameraX, cameraY } = this
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Filter and sort: show only active z, draw back-to-front.
    const visible = entities
      .filter(e => e.z === activeZ)
      .sort((a, b) => a.y - b.y || a.x - b.x)

    for (const entity of visible) {
      const sx = entity.x - cameraX
      const sy = entity.y - entity.z - cameraY

      if (sx < -1 || sx >= this.viewWidth + 1 || sy < -1 || sy >= this.viewHeight + 1) continue

      const sprite = EDITOR_SPRITES[entity.type]
      if (sprite) {
        sprite.draw(ctx, this.spriteSheet, scale, sx, sy)
      }
    }

    // Draw grid overlay.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    for (let x = 0; x < this.viewWidth; x++) {
      for (let y = 0; y < this.viewHeight; y++) {
        ctx.strokeRect(x * this.destW, y * this.rowStep, this.destW, this.rowStep)
      }
    }

    // Hover highlight.
    if (hoveredCell) {
      const hx = hoveredCell.x - cameraX
      const hy = hoveredCell.y - activeZ - cameraY
      if (hx >= 0 && hx < this.viewWidth && hy >= 0 && hy < this.viewHeight) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.fillRect(hx * this.destW, hy * this.rowStep, this.destW, this.rowStep)
      }
    }
  }
}
