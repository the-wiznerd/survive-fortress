import { WorldRenderer, CELL_W, CELL_H, type RenderEntity } from '@repo/rendering'

export class EditorRenderer {
  private world: WorldRenderer
  private cameraX = 0
  private cameraY = 0

  readonly destW: number
  readonly rowStep: number

  get onReady() { return this.world.onReady }
  set onReady(cb: (() => void) | null) { this.world.onReady = cb }

  constructor(
    private canvas: HTMLCanvasElement,
    private viewWidth: number,
    private viewHeight: number,
    private scale: number,
  ) {
    this.destW = CELL_W * scale
    this.rowStep = CELL_H * scale
    this.world = new WorldRenderer(canvas, viewWidth, viewHeight, scale, '/sprites/sprites.png')
  }

  setCamera(x: number, y: number) {
    this.cameraX = x
    this.cameraY = y
  }

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
    entities: RenderEntity[],
    activeZ: number,
    hoveredCell: { x: number; y: number } | null,
  ) {
    if (!this.world.ready) return

    const self = this
    this.world.render(entities, this.cameraX, this.cameraY, new Set(), {
      onAfterEntities(ctx) {
        // Grid overlay.
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.lineWidth = 1
        for (let x = 0; x < self.viewWidth; x++) {
          for (let y = 0; y < self.viewHeight; y++) {
            ctx.strokeRect(x * self.destW, y * self.rowStep, self.destW, self.rowStep)
          }
        }

        // Hover highlight.
        if (hoveredCell) {
          const hx = hoveredCell.x - self.cameraX
          const hy = hoveredCell.y - activeZ - self.cameraY
          if (hx >= 0 && hx < self.viewWidth && hy >= 0 && hy < self.viewHeight) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
            ctx.fillRect(hx * self.destW, hy * self.rowStep, self.destW, self.rowStep)
          }
        }
      },
    })
  }
}
