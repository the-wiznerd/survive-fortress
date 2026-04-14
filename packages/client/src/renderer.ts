import type { GameView, ViewEntity } from '@sf/server/sdk'
import { CELL_W, CELL_H, DrawContext, type RenderContext, zKey, posKey } from './rendering/types.js'
import { EntityRenderer } from './rendering/entities/EntityRenderer.js'
import { DirtRenderer } from './rendering/entities/DirtRenderer.js'
import { SandRenderer } from './rendering/entities/SandRenderer.js'
import { StoneRenderer } from './rendering/entities/StoneRenderer.js'
import { WaterRenderer } from './rendering/entities/WaterRenderer.js'
import { PlayerRenderer } from './rendering/entities/PlayerRenderer.js'

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
    ctx.fillStyle = '#1a1a2e'
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
    const terrainAt = new Set<number>()
    const typeAt = new Map<number, string>()
    for (const row of terrainRows) {
      for (const { entity, renderer } of row) {
        const k = zKey(entity.x, entity.y)
        const prev = maxZ.get(k)
        if (prev === undefined || entity.z > prev) maxZ.set(k, entity.z)
        if (renderer.occluding) terrainAt.add(posKey(entity.x, entity.y, entity.z))
        typeAt.set(posKey(entity.x, entity.y, entity.z), entity.type)
      }
    }
    const rc: RenderContext = { maxZ, terrainAt, typeAt, now: performance.now() }

    // Pass 1: Terrain (back-to-front).
    for (const row of terrainRows) {
      row.sort((a, b) => a.entity.z - b.entity.z)
      for (const { entity, sx, sy, renderer } of row) {
        renderer.render(entity, new DrawContext(ctx, this.spriteSheet, this.scale, sx, sy, entity.x, entity.y, entity.z, rc))
      }
    }

    // Pass 2: Upright entities (back-to-front), drawn over all terrain.
    for (const row of uprightRows) {
      row.sort((a, b) => a.entity.z - b.entity.z)
      for (const { entity, sx, sy, renderer } of row) {
        renderer.render(entity, new DrawContext(ctx, this.spriteSheet, this.scale, sx, sy, entity.x, entity.y, entity.z, rc))
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
}
