import type { GameView, ViewEntity } from '@repo/server/sdk'
import { WorldRenderer, CELL_W, CELL_H, zKey, type RenderEntity, type EntityRenderer } from '@repo/rendering'
import { getMoveQueue } from './input'

export class Renderer {
  private world: WorldRenderer
  private cameraX = 0
  private cameraY = 0

  /** Scaled pixel width of one tile on screen. */
  private destW: number
  /** Scaled row-advance (= face height) in screen pixels. */
  private rowStep: number

  constructor(
    canvas: HTMLCanvasElement,
    private viewWidth: number,
    private viewHeight: number,
    private scale: number,
  ) {
    this.destW = CELL_W * scale
    this.rowStep = CELL_H * scale
    this.world = new WorldRenderer(canvas, viewWidth, viewHeight, scale, '/sprites/sprites.png')
  }

  /** Callback invoked when the sprite sheet finishes loading. */
  get onReady() { return this.world.onReady }
  set onReady(cb: (() => void) | null) { this.world.onReady = cb }

  setCamera(x: number, y: number) {
    this.cameraX = x - Math.floor(this.viewWidth / 2)
    this.cameraY = y - Math.floor(this.viewHeight / 2)
  }

  /** Convert canvas pixel coordinates to world (x, y). */
  screenToWorld(canvasX: number, canvasY: number): { x: number; y: number } | null {
    const sx = Math.floor(canvasX / this.destW)
    const sy = Math.floor(canvasY / this.rowStep)
    if (sx < 0 || sx >= this.viewWidth || sy < 0 || sy >= this.viewHeight) return null
    return { x: sx + this.cameraX, y: sy + this.cameraY }
  }

  render(view: GameView, hoveredCell?: { x: number; y: number } | null, selectedCell?: { x: number; y: number } | null) {
    if (!this.world.ready) return

    const entities: RenderEntity[] = view.entities.map(e => ({
      type: e.type,
      x: e.x,
      y: e.y,
      z: e.z,
      traits: e.traits as Record<string, unknown>,
    }))

    const self = this

    // Compute known columns from the player's position + vision range.
    const knownColumns = new Set<number>()
    const player = view.entities.find(e => String(e.id) === view.playerId)
    const vision = player?.traits.vision as { horizontalRange: number; verticalRange: number } | undefined
    if (player && vision) {
      const r2 = vision.horizontalRange * vision.horizontalRange
      for (let dx = -vision.horizontalRange; dx <= vision.horizontalRange; dx++) {
        for (let dy = -vision.horizontalRange; dy <= vision.horizontalRange; dy++) {
          if (dx * dx + dy * dy <= r2) {
            knownColumns.add(zKey(player.x + dx, player.y + dy))
          }
        }
      }
    }

    this.world.render(entities, this.cameraX, this.cameraY, knownColumns, player?.z ?? -Infinity, vision?.verticalRange ?? 0, {
      onAfterTerrain(ctx) {
        self.drawMoveArrows(ctx, view)
      },
      onAfterEntities(ctx) {
        self.drawTileHighlight(ctx, hoveredCell ?? null, 'rgba(255, 255, 255, 0.35)')
        self.drawTileHighlight(ctx, selectedCell ?? null, 'rgba(135, 206, 235, 0.6)')
      },
    })
  }

  /** Get the EntityRenderer for a given type name (used by inspector). */
  getEntityRenderer(typeName: string): EntityRenderer | undefined {
    return this.world.getEntityRenderer(typeName)
  }

  private drawTileHighlight(
    ctx: CanvasRenderingContext2D,
    cell: { x: number; y: number } | null,
    color: string,
  ) {
    if (!cell) return
    const sx = cell.x - this.cameraX
    const sy = cell.y - this.cameraY
    if (sx < 0 || sx >= this.viewWidth || sy < 0 || sy >= this.viewHeight) return

    const px = sx * this.destW
    const py = sy * this.rowStep

    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.strokeRect(px + 1, py + 1, this.destW - 2, this.rowStep - 2)
  }

  private drawMoveArrows(ctx: CanvasRenderingContext2D, view: GameView) {
    const queue = getMoveQueue()
    if (queue.length === 0) return

    const player = view.entities.find(e => String(e.id) === view.playerId)
    if (!player) return

    const cellW = CELL_W * this.scale
    const cellH = CELL_H * this.scale

    let x = player.x
    let y = player.y
    const drawZ = player.z - 1

    // Need sprite sheet access for arrow drawing.
    const spriteSheet = this.world.spriteSheet

    for (const step of queue) {
      x += step.dx
      y += step.dy

      const sx = x - this.cameraX
      const sy = y - this.cameraY
      if (sx < 0 || sx >= this.viewWidth || sy < 0 || sy >= this.viewHeight) continue

      const col = arrowCol(step.dx, step.dy)
      ctx.drawImage(spriteSheet,
        col * CELL_W, ARROW_ROW * CELL_H, CELL_W, CELL_H,
        sx * cellW, sy * cellH - drawZ * cellH,
        cellW, cellH)
    }
  }
}

const ARROW_ROW = 16

function arrowCol(dx: number, dy: number): number {
  if (dy < 0) return 0 // up
  if (dx > 0) return 1 // right
  if (dy > 0) return 2 // down
  return 3             // left
}
