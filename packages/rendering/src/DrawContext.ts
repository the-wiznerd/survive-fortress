import { TILE_W, SPRITE_H, TOP_FACE_H, FRONT_FACE_H, ATLAS_ROW_H } from '~rendering/constants.js'
import type { TerrainVariants } from '~rendering/sprites.js'
import { zKey, posKey } from '~rendering/spatial.js'
import type { RenderContext } from '~rendering/RenderContext.js'

/**
 * Per-entity drawing context. Captures the sprite sheet, canvas, and position
 * so entity renderers just call dc.draw(col, row). All drawing is at 1:1 scale.
 */
export class DrawContext {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private sheet: HTMLImageElement,
    private atlas: ImageBitmap | HTMLCanvasElement | null,
    private sx: number,
    private sy: number,
    /** World X coordinate. */
    readonly wx: number,
    /** World Y coordinate. */
    readonly wy: number,
    /** Elevation. */
    readonly z: number,
    /** Per-frame render context. */
    readonly rc: RenderContext,
  ) { }

  draw(col: number, row: number, w = 1, h = 1) {
    this.ctx.drawImage(this.sheet,
      col * TILE_W, row * SPRITE_H, TILE_W * w, SPRITE_H * h,
      this.sx * TILE_W, (this.sy + 1) * TOP_FACE_H - (this.z - 1) * FRONT_FACE_H - h * SPRITE_H,
      TILE_W * w, SPRITE_H * h)
  }

  /** Draw a top face (TOP_H px) from the sprite sheet. row = pair base row in CELL_H grid. */
  drawSheetTop(col: number, row: number, yOff = 0) {
    this.ctx.drawImage(this.sheet,
      col * TILE_W, row * SPRITE_H, TILE_W, TOP_FACE_H,
      this.sx * TILE_W, this.sy * TOP_FACE_H - this.z * FRONT_FACE_H + yOff * TOP_FACE_H,
      TILE_W, TOP_FACE_H)
  }

  /** Draw a front face (FRONT_H px) from the sprite sheet. row = pair base row in CELL_H grid. */
  drawSheetFront(col: number, row: number, yOff = 0) {
    this.ctx.drawImage(this.sheet,
      col * TILE_W, row * SPRITE_H + TOP_FACE_H, TILE_W, FRONT_FACE_H,
      this.sx * TILE_W, this.sy * TOP_FACE_H - this.z * FRONT_FACE_H + yOff * TOP_FACE_H,
      TILE_W, FRONT_FACE_H)
  }

  /** Draw a cell from the generated terrain atlas. */
  drawFromAtlas(col: number, row: number, yOff = 0, h = TOP_FACE_H) {
    if (!this.atlas) return
    this.ctx.drawImage(this.atlas,
      col * TILE_W, row * ATLAS_ROW_H, TILE_W, h,
      this.sx * TILE_W, this.sy * TOP_FACE_H - this.z * FRONT_FACE_H + yOff * TOP_FACE_H,
      TILE_W, h)
  }

  get frontOccluded(): boolean {
    if (!this.isKnown(this.wx, this.wy + 1)) return true
    // If the south column is within horizontal vision but has no visible
    // entities at all, treat it as unknown rather than empty — the column
    // may be outside vertical vision or fully occluded.
    if (this.rc.knownColumns.size > 0
      && !this.rc.maxZ.has(zKey(this.wx, this.wy + 1))) return true
    return this.rc.terrainAt.has(posKey(this.wx, this.wy + 1, this.z))
  }

  private isKnown(x: number, y: number): boolean {
    if (this.rc.knownColumns.size === 0) return true
    return this.rc.knownColumns.has(zKey(x, y))
  }

  edgeFlags(): { n: number; e: number; s: number; w: number } {
    const { maxZ } = this.rc
    const { wx, wy, z } = this
    const n = this.isKnown(wx, wy - 1) && (maxZ.get(zKey(wx, wy - 1)) ?? -Infinity) < z ? 1 : 0
    const e = this.isKnown(wx + 1, wy) && (maxZ.get(zKey(wx + 1, wy)) ?? -Infinity) < z ? 1 : 0
    const w = this.isKnown(wx - 1, wy) && (maxZ.get(zKey(wx - 1, wy)) ?? -Infinity) < z ? 1 : 0
    const minZ = this.rc.minZ.get(zKey(wx, wy))
    const s = minZ !== undefined && minZ < z
      && !this.rc.terrainAt.has(posKey(wx, wy, z - 1)) ? 1 : 0
    return { n, e, s, w }
  }

  drawTerrain(tv: TerrainVariants, fromAtlas = false) {
    const { n, e, s, w } = this.edgeFlags()
    const isTop = this.z === this.rc.maxZ.get(zKey(this.wx, this.wy))
    const aboveUnknown = isTop
      && this.rc.knownColumns.size > 0
      && this.z + 1 > this.rc.playerZ + this.rc.verticalRange
    const top = aboveUnknown ? tv.unknownTop : tv.topFaces[n * 4 + e * 2 + w]
    if (fromAtlas) {
      this.drawFromAtlas(top.col, top.row)
    } else {
      this.drawSheetTop(top.col, top.row)
    }
    if (!this.frontOccluded) {
      const front = tv.frontFaces[s * 4 + e * 2 + w]
      if (fromAtlas) {
        this.drawFromAtlas(front.col, front.row, 1, FRONT_FACE_H)
      } else {
        this.drawSheetFront(front.col, front.row, 1)
      }
    }
  }
}
