import { type RenderContext, type RenderEntity, DrawContext } from './types.js'
import type { TerrainDef } from './TerrainAtlas.js'
import { EntityRenderer } from './entities/EntityRenderer.js'
import { DirtRenderer } from './entities/DirtRenderer.js'
import { SandRenderer } from './entities/SandRenderer.js'
import { StoneRenderer } from './entities/StoneRenderer.js'
import { WaterRenderer } from './entities/WaterRenderer.js'
import { PlayerRenderer } from './entities/PlayerRenderer.js'

/** Registry of entity type name → renderer instance. */
const ENTITY_RENDERERS: Record<string, EntityRenderer> = {
  dirt: new DirtRenderer(),
  sand: new SandRenderer(),
  stone: new StoneRenderer(),
  water: new WaterRenderer(),
  player: new PlayerRenderer(),
}

/** Stage callbacks for consumer-specific overlays between render passes. */
export interface RenderHooks {
  /** Called after terrain is drawn and before upright entities. */
  onAfterTerrain?: (ctx: CanvasRenderingContext2D) => void
  /** Called after all entity rendering is complete. */
  onAfterEntities?: (ctx: CanvasRenderingContext2D) => void
}

import { Colors } from './colors.js'

/** Silhouette color for occluded upright entities. */
const SILHOUETTE_COLOR = Colors.gray

/**
 * Opinionated world rendering pipeline.
 * Takes entities + a canvas and produces the rendered world.
 * Consumers layer their own UI (highlights, grid, etc.) on top.
 */
export class WorldRenderer {
  private ctx: CanvasRenderingContext2D
  readonly spriteSheet: HTMLImageElement
  private spriteReady = false
  private silhouetteCanvas: HTMLCanvasElement
  private silhouetteCtx: CanvasRenderingContext2D

  readonly terrainAtlas = new TerrainAtlas()
  private atlasSource: ImageBitmap | HTMLCanvasElement | null = null

  readonly destW: number
  readonly rowStep: number

  onReady: (() => void) | null = null

  constructor(
    private canvas: HTMLCanvasElement,
    readonly viewWidth: number,
    readonly viewHeight: number,
    readonly scale: number,
    spritePath: string,
  ) {
    this.destW = CELL_W * scale
    this.rowStep = CELL_H * scale

    canvas.width = viewWidth * this.destW
    canvas.height = this.rowStep * 2 + (viewHeight - 1) * this.rowStep
    this.ctx = canvas.getContext('2d')!
    this.ctx.imageSmoothingEnabled = false

    // Offscreen canvas for silhouette rendering.
    this.silhouetteCanvas = document.createElement('canvas')
    this.silhouetteCanvas.width = 4 * this.destW
    this.silhouetteCanvas.height = 5 * this.rowStep
    this.silhouetteCtx = this.silhouetteCanvas.getContext('2d')!
    this.silhouetteCtx.imageSmoothingEnabled = false

    this.spriteSheet = new Image()
    this.spriteSheet.src = spritePath
    this.spriteSheet.onload = async () => {
      this.spriteReady = true

      // Register and generate terrain atlas.
      for (const renderer of Object.values(ENTITY_RENDERERS)) {
        const defs = (renderer.constructor as { terrainDefs?: Record<string, import('./TerrainAtlas.js').TerrainDef> }).terrainDefs
        if (defs) {
          for (const [name, def] of Object.entries(defs)) {
            this.terrainAtlas.register(name, def)
          }
        }
      }
      await this.terrainAtlas.generate()
      this.atlasSource = this.terrainAtlas.bitmap ?? this.terrainAtlas.canvas

      // Bind atlas variants to renderers.
      const dirt = ENTITY_RENDERERS.dirt as DirtRenderer
      dirt.bindAtlas(this.terrainAtlas.getVariants('dirt')!, this.terrainAtlas.getVariants('grass')!)
        ; (ENTITY_RENDERERS.sand as SandRenderer).bindAtlas(this.terrainAtlas.getVariants('sand')!)
        ; (ENTITY_RENDERERS.stone as StoneRenderer).bindAtlas(this.terrainAtlas.getVariants('stone')!)

      this.onReady?.()
    }
  }

  get ready(): boolean {
    return this.spriteReady
  }

  /** Get the EntityRenderer for a given type name. */
  getEntityRenderer(typeName: string): EntityRenderer | undefined {
    return ENTITY_RENDERERS[typeName]
  }

  /**
   * Render the world.
   * @param entities - All entities to draw.
   * @param cameraX - Left edge of the viewport in world X.
   * @param cameraY - Top edge of the viewport in world Y.
   * @param knownPositions - Set of "x,y,z" keys visible to the player. Empty = show all.
   * @param hooks - Optional callbacks between render passes.
   */
  render(
    entities: RenderEntity[],
    cameraX: number,
    cameraY: number,
    knownColumns: Set<number>,
    playerZ = -Infinity,
    verticalRange = 0,
    hooks?: RenderHooks,
  ) {
    if (!this.spriteReady) return

    const { ctx, viewWidth, viewHeight, scale } = this
    const camX = Math.floor(cameraX)
    const camY = Math.floor(cameraY)

    // Clear.
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Bucket entities into terrain vs upright rows for back-to-front drawing.
    type Entry = { entity: RenderEntity; sx: number; sy: number; renderer: EntityRenderer }
    const terrainRows: Entry[][] = []
    const uprightRows: Entry[][] = []
    for (let i = 0; i < viewHeight; i++) { terrainRows.push([]); uprightRows.push([]) }

    for (const entity of entities) {
      const sx = entity.x - camX
      const sy = entity.y - camY
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
    const rc: RenderContext = { maxZ, occludingMaxZ, terrainAt, typeAt, knownColumns, playerZ, verticalRange, now: performance.now() }

    // Pass 1: Terrain (back-to-front).
    for (const row of terrainRows) {
      row.sort((a, b) => a.entity.z - b.entity.z)
      for (const { entity, sx, sy, renderer } of row) {
        renderer.render(entity, new DrawContext(ctx, this.spriteSheet, this.atlasSource, scale, sx, sy, entity.x, entity.y, entity.z, rc))
      }
    }

    // Hook: after terrain, before upright.
    hooks?.onAfterTerrain?.(ctx)

    // Pass 2: Upright entities (back-to-front), with silhouette occlusion.
    for (const row of uprightRows) {
      row.sort((a, b) => a.entity.z - b.entity.z)
      for (const { entity, sx, sy, renderer } of row) {
        if (this.isOccludedByForeground(entity, rc)) {
          this.drawSplitOccluded(entity, sx, sy, renderer, rc)
        } else {
          renderer.render(entity, new DrawContext(ctx, this.spriteSheet, this.atlasSource, scale, sx, sy, entity.x, entity.y, entity.z, rc))
        }
      }
    }

    // Hook: after all entities.
    hooks?.onAfterEntities?.(ctx)
  }

  private isOccludedByForeground(entity: RenderEntity, rc: RenderContext): boolean {
    const southMaxZ = rc.occludingMaxZ.get(zKey(entity.x, entity.y + 1))
    return southMaxZ !== undefined && southMaxZ >= entity.z
  }

  private drawSplitOccluded(entity: RenderEntity, sx: number, sy: number, renderer: EntityRenderer, rc: RenderContext) {
    const { silhouetteCtx: offCtx, silhouetteCanvas: offCanvas, ctx, scale } = this
    const cellH = CELL_H * scale
    const cellW = CELL_W * scale

    const occZ = rc.occludingMaxZ.get(zKey(entity.x, entity.y + 1))!
    const clipY = (sy + 1) * cellH - occZ * cellH

    // Visible above clip.
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, ctx.canvas.width, clipY)
    ctx.clip()
    renderer.render(entity, new DrawContext(ctx, this.spriteSheet, this.atlasSource, scale, sx, sy, entity.x, entity.y, entity.z, rc))
    ctx.restore()

    // Silhouette below clip.
    const offSx = 1, offSy = 1
    offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height)
    renderer.render(entity, new DrawContext(offCtx, this.spriteSheet, this.atlasSource, scale, offSx, offSy, entity.x, entity.y, 0, rc))

    offCtx.globalCompositeOperation = 'source-in'
    offCtx.fillStyle = SILHOUETTE_COLOR
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
}
