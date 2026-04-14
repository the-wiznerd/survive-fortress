/** Sprite sheet: 16×12px cells. Each cell is one face (top or front). */
export const CELL_W = 16
export const CELL_H = 12

export type StaticSprite = { col: number; row: number }
export type AnimatedSprite = { frames: StaticSprite[]; interval: number }

/**
 * Edge variant lookup for terrain with elevation-aware borders.
 * topCols: indexed by N*4 + E*2 + W (0–7) → source column for top face.
 * frontCols: indexed by E*2 + W (0–3) → source column for front face.
 * All face cells live in the same row.
 */
export interface EdgeVariants {
  row: number
  topCols: number[]
  frontCols: number[]
}

/** Per-frame context passed to entity renderers. */
export interface RenderContext {
  /** Max terrain z at each world (x, y). */
  maxZ: Map<number, number>
  /** Set of packed (x, y, z) keys where terrain exists. */
  terrainAt: Set<number>
  /** Entity type at each (x, y, z) for neighbor checks. */
  typeAt: Map<number, string>
  /** Current timestamp from performance.now(). */
  now: number
}

/**
 * Per-entity drawing context. Captures the sprite sheet, canvas, position,
 * and scale so entity renderers just call dc.draw(col, row).
 */
export class DrawContext {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private sheet: HTMLImageElement,
    private scale: number,
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

  /**
   * Draw cells from the sprite sheet at this entity's screen position.
   * @param col   Source cell column
   * @param row   Source cell row
   * @param w     Width in cells (default 1)
   * @param h     Height in cells (default 1)
   * @param yOff  Extra Y offset in cells (e.g. 1 = one cell down, -0.5 = half cell up)
   */
  draw(col: number, row: number, w = 1, h = 1, yOff = 0) {
    const cellW = CELL_W * this.scale
    const cellH = CELL_H * this.scale
    this.ctx.drawImage(this.sheet,
      col * CELL_W, row * CELL_H, CELL_W * w, CELL_H * h,
      this.sx * cellW, this.sy * cellH - this.z * cellH + yOff * cellH,
      cellW * w, cellH * h)
  }

  /** Whether the front face is hidden by terrain in the next row. */
  get frontOccluded(): boolean {
    return this.rc.terrainAt.has(posKey(this.wx, this.wy + 1, this.z))
  }

  /** Compute edge flags (N, E, W as 0|1) based on neighboring elevation. */
  edgeFlags(): { n: number; e: number; w: number } {
    const { maxZ } = this.rc
    const { wx, wy, z } = this
    const n = (maxZ.get(zKey(wx, wy - 1)) ?? -Infinity) < z ? 1 : 0
    const e = (maxZ.get(zKey(wx + 1, wy)) ?? -Infinity) < z ? 1 : 0
    const w = (maxZ.get(zKey(wx - 1, wy)) ?? -Infinity) < z ? 1 : 0
    return { n, e, w }
  }

  /** Draw a terrain tile with edge-aware top and front faces. */
  drawEdgeTerrain(edge: EdgeVariants) {
    const { n, e, w } = this.edgeFlags()
    this.draw(edge.topCols[n * 4 + e * 2 + w], edge.row)
    if (!this.frontOccluded) {
      this.draw(edge.frontCols[e * 2 + w], edge.row, 1, 1, 1)
    }
  }
}

/** Hashed key for (x, y) elevation lookups. */
export function zKey(x: number, y: number): number {
  return y * 100000 + x
}

/** Packed key for (x, y, z) terrain presence lookups. */
export function posKey(x: number, y: number, z: number): number {
  return ((z + 128) << 20) | ((y & 0x3FF) << 10) | (x & 0x3FF)
}
