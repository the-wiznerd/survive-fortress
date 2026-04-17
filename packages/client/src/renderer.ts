import type { GameView, ViewEntity } from '@repo/server/sdk'
import { getMoveQueue } from './input'

/** Registry of entity type name → renderer instance. */
const ENTITY_RENDERERS: Record<string, EntityRenderer> = {
  dirt: new DirtRenderer(),
  sand: new SandRenderer(),
  stone: new StoneRenderer(),
  water: new WaterRenderer(),
  player: new PlayerRenderer(),
}

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private cameraX = 0
  private cameraY = 0
  private spriteSheet: HTMLImageElement
  private spriteReady = false
  private silhouetteCanvas: HTMLCanvasElement
  private silhouetteCtx: CanvasRenderingContext2D

  /** Scaled pixel width of one tile on screen. */
  private destW: number
  /** Scaled row-advance (= face height) in screen pixels. */
  private rowStep: number

  constructor(
    private canvas: HTMLCanvasElement,
    private viewWidth: number,
    private viewHeight: number,
    private scale: number, // pixels per source pixel
  ) {
    this.destW = CELL_W * scale
    this.rowStep = CELL_H * scale

    // Canvas: full tile width, rows overlap by the front-face height.
    canvas.width = viewWidth * this.destW
    // First row gets two faces (top + front); each subsequent row adds one rowStep.
    canvas.height = this.rowStep * 2 + (viewHeight - 1) * this.rowStep
    this.ctx = canvas.getContext('2d')!

    // Crisp pixel scaling.
    this.ctx.imageSmoothingEnabled = false

    // Offscreen canvas for silhouette rendering.
    this.silhouetteCanvas = document.createElement('canvas')
    this.silhouetteCanvas.width = 4 * this.destW
    this.silhouetteCanvas.height = 5 * this.rowStep
    this.silhouetteCtx = this.silhouetteCanvas.getContext('2d')!
    this.silhouetteCtx.imageSmoothingEnabled = false

    // Load sprite sheet.
    this.spriteSheet = new Image()
    this.spriteSheet.src = '/sprites/sprites.png'
    this.spriteSheet.onload = () => {
      this.spriteReady = true
      this.onReady?.()
    }
  }

  /** Callback invoked when the sprite sheet finishes loading. */
  onReady: (() => void) | null = null

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
    const { ctx, destW, rowStep, viewWidth, viewHeight, cameraX, cameraY } = this

    if (!this.spriteReady) return

    // Clear.
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Collect visible entities into rows for back-to-front drawing.
    type Entry = { entity: ViewEntity; sx: number; sy: number; renderer: EntityRenderer }
    const terrainRows: Entry[][] = []
    const uprightRows: Entry[][] = []
    for (let i = 0; i < viewHeight; i++) { terrainRows.push([]); uprightRows.push([]) }

    for (const entity of view.entities) {
      const sx = entity.x - cameraX
      const sy = entity.y - cameraY
      if (sx < 0 || sx >= viewWidth || sy < 0 || sy >= viewHeight) continue
      const er = ENTITY_RENDERERS[entity.type]
      if (!er) continue
      const bucket = er.terrain ? terrainRows : uprightRows
      bucket[sy].push({ entity, sx, sy, renderer: er })
    }

    // Build per-frame render context.
    const maxZ = new Map<number, number>()
    const occludingMaxZ = new Map<number, number>()
    const terrainAt = new Set<number>()
    const typeAt = new Map<number, string>()
    for (const row of terrainRows) {
      for (const { entity, renderer } of row) {
        const k = zKey(entity.x, entity.y)
        const prev = maxZ.get(k)
        if (prev === undefined || entity.z > prev) maxZ.set(k, entity.z)
        if (renderer.occluding) {
          terrainAt.add(posKey(entity.x, entity.y, entity.z))
          const oprev = occludingMaxZ.get(k)
          if (oprev === undefined || entity.z > oprev) occludingMaxZ.set(k, entity.z)
        }
        typeAt.set(posKey(entity.x, entity.y, entity.z), entity.type)
      }
    }
    const rc: RenderContext = { maxZ, occludingMaxZ, terrainAt, typeAt, now: performance.now() }

    // Pass 1: Terrain (back-to-front).
    for (const row of terrainRows) {
      row.sort((a, b) => a.entity.z - b.entity.z)
      for (const { entity, sx, sy, renderer } of row) {
        renderer.render(entity, new DrawContext(ctx, this.spriteSheet, this.scale, sx, sy, entity.x, entity.y, entity.z, rc))
      }
    }

    // Pass 1.5: Movement arrows (on terrain surface, before upright entities).
    this.drawMoveArrows(ctx, view)

    // Pass 2: Upright entities (back-to-front), drawn over all terrain.
    // Entities behind occluding terrain are drawn as silhouettes.
    for (const row of uprightRows) {
      row.sort((a, b) => a.entity.z - b.entity.z)
      for (const { entity, sx, sy, renderer } of row) {
        if (this.isOccludedByForeground(entity, rc)) {
          this.drawSplitOccluded(entity, sx, sy, renderer, rc)
        } else {
          renderer.render(entity, new DrawContext(ctx, this.spriteSheet, this.scale, sx, sy, entity.x, entity.y, entity.z, rc))
        }
      }
    }

    // Draw tile highlights after all sprites so they overlay.
    this.drawTileHighlight(ctx, hoveredCell ?? null, 'rgba(255, 255, 255, 0.35)')
    this.drawTileHighlight(ctx, selectedCell ?? null, 'rgba(135, 206, 235, 0.6)')
  }

  /** Get the EntityRenderer for a given type name (used by inspector). */
  getEntityRenderer(typeName: string): EntityRenderer | undefined {
    return ENTITY_RENDERERS[typeName]
  }

  /** Check if an upright entity is behind occluding terrain to the south. */
  private isOccludedByForeground(entity: ViewEntity, rc: RenderContext): boolean {
    const southMaxZ = rc.occludingMaxZ.get(zKey(entity.x, entity.y + 1))
    return southMaxZ !== undefined && southMaxZ >= entity.z
  }

  /**
   * Draw an entity split at the occlusion boundary:
   * visible portion (above terrain) renders normally,
   * occluded portion (behind terrain) renders as a solid-color silhouette.
   */
  private drawSplitOccluded(entity: ViewEntity, sx: number, sy: number, renderer: EntityRenderer, rc: RenderContext) {
    const { silhouetteCtx: offCtx, silhouetteCanvas: offCanvas, ctx, scale } = this
    const cellH = CELL_H * scale
    const cellW = CELL_W * scale

    // Clip Y: top edge of the occluding terrain's top face at (x, y+1).
    const occZ = rc.occludingMaxZ.get(zKey(entity.x, entity.y + 1))!
    const clipY = (sy + 1) * cellH - occZ * cellH

    // Visible portion: render normally, clipped above the occlusion line.
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, ctx.canvas.width, clipY)
    ctx.clip()
    renderer.render(entity, new DrawContext(ctx, this.spriteSheet, scale, sx, sy, entity.x, entity.y, entity.z, rc))
    ctx.restore()

    // Occluded portion: render silhouette, clipped below the occlusion line.
    const offSx = 1, offSy = 1
    offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height)
    renderer.render(entity, new DrawContext(offCtx, this.spriteSheet, scale, offSx, offSy, entity.x, entity.y, 0, rc))

    offCtx.globalCompositeOperation = 'source-in'
    offCtx.fillStyle = '#3f3f3f'
    offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height)
    offCtx.globalCompositeOperation = 'source-over'

    ctx.save()
    ctx.beginPath()
    ctx.rect(0, clipY, ctx.canvas.width, ctx.canvas.height - clipY)
    ctx.clip()
    const dx = (sx - offSx) * cellW
    const dy = (sy - entity.z - offSy) * cellH
    ctx.drawImage(offCanvas, dx, dy)
    ctx.restore()
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

    for (const step of queue) {
      x += step.dx
      y += step.dy

      const sx = x - this.cameraX
      const sy = y - this.cameraY
      if (sx < 0 || sx >= this.viewWidth || sy < 0 || sy >= this.viewHeight) continue

      const col = arrowCol(step.dx, step.dy)
      ctx.drawImage(this.spriteSheet,
        col * CELL_W, ARROW_ROW * CELL_H, CELL_W, CELL_H,
        sx * cellW, sy * cellH - drawZ * cellH,
        cellW, cellH)
    }
  }
}

const ARROW_ROW = 8

function arrowCol(dx: number, dy: number): number {
  if (dy < 0) return 0 // up
  if (dx > 0) return 1 // right
  if (dy > 0) return 2 // down
  return 3             // left
}
