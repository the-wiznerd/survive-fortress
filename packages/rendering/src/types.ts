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
export interface TerrainVariants {
  row: number
  topCols: number[]
  frontCols: number[]
}

/**
 * Standard layout offsets from base column for terrain edge variants.
 *
 * Top face (8 variants, indexed by N*4 + E*2 + W):
 *   +0 flat    +5 N
 *   +1 W       +4 NW
 *   +2 E       +6 NE
 *   +3 EW      +3 NEW (same as EW)
 *
 * Front face (4 variants, indexed by E*2 + W):
 *   +9 flat    +7 EW
 *   +8 W       +10 E
 */
const TOP_OFFSETS = [0, 1, 2, 3, 5, 4, 6, 3]
const FRONT_OFFSETS = [9, 8, 10, 7]

/** Top-face edge variant names, indexed by N*4 + E*2 + W. */
export const TOP_VARIANT = {
  FLAT: 0, W: 1, E: 2, EW: 3,
  N: 4, NW: 5, NE: 6, NEW: 7,
} as const

/** Front-face edge variant names, indexed by E*2 + W. */
export const FRONT_VARIANT = {
  FLAT: 0, W: 1, E: 2, EW: 3,
} as const

/** Build a TerrainVariants from a sprite row and base column. */
export function terrainVariants(row: number, baseCol: number): TerrainVariants {
  return {
    row,
    topCols: TOP_OFFSETS.map(o => baseCol + o),
    frontCols: FRONT_OFFSETS.map(o => baseCol + o),
  }
}

// ─── Spatial Key Helpers ───

export function zKey(x: number, y: number): number {
  return y * 100000 + x
}

export function posKey(x: number, y: number, z: number): number {
  return ((z + 128) << 20) | ((y & 0x3FF) << 10) | (x & 0x3FF)
}

// ─── Rendering Entity Interface ───

/**
 * Minimal entity shape consumed by the rendering pipeline.
 * No dependency on @repo/server — consumers map their data into this shape.
 */
export interface RenderEntity {
  type: string
  x: number
  y: number
  z: number
  traits: Record<string, unknown>
}

// ─── Render Context ───

/** Per-frame context shared across all entity draws. */
export interface RenderContext {
  /** Max terrain z at each world (x, y). */
  maxZ: Map<number, number>
  /** Max z of occluding terrain at each world (x, y). */
  occludingMaxZ: Map<number, number>
  /** Set of packed (x, y, z) keys where terrain exists. */
  terrainAt: Set<number>
  /** Entity type at each (x, y, z) for neighbor checks. */
  typeAt: Map<number, string>
  /** Set of "x,y,z" keys known to be visible (empty = show all). */
  knownPositions: Set<string>
  /** Current timestamp from performance.now(). */
  now: number
}

// ─── Draw Context ───

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

  draw(col: number, row: number, w = 1, h = 1, yOff = 0) {
    const cellW = CELL_W * this.scale
    const cellH = CELL_H * this.scale
    this.ctx.drawImage(this.sheet,
      col * CELL_W, row * CELL_H, CELL_W * w, CELL_H * h,
      this.sx * cellW, this.sy * cellH - this.z * cellH + yOff * cellH,
      cellW * w, cellH * h)
  }

  get frontOccluded(): boolean {
    if (!this.isKnown(this.wx, this.wy + 1)) return true
    return this.rc.terrainAt.has(posKey(this.wx, this.wy + 1, this.z))
  }

  private isKnown(x: number, y: number): boolean {
    if (this.rc.knownPositions.size === 0) return true
    return this.rc.maxZ.has(zKey(x, y))
  }

  edgeFlags(): { n: number; e: number; w: number } {
    const { maxZ } = this.rc
    const { wx, wy, z } = this
    const n = this.isKnown(wx, wy - 1) && (maxZ.get(zKey(wx, wy - 1)) ?? -Infinity) < z ? 1 : 0
    const e = this.isKnown(wx + 1, wy) && (maxZ.get(zKey(wx + 1, wy)) ?? -Infinity) < z ? 1 : 0
    const w = this.isKnown(wx - 1, wy) && (maxZ.get(zKey(wx - 1, wy)) ?? -Infinity) < z ? 1 : 0
    return { n, e, w }
  }

  drawTerrain(tv: TerrainVariants) {
    const { n, e, w } = this.edgeFlags()
    this.draw(tv.topCols[n * 4 + e * 2 + w], tv.row)
    if (!this.frontOccluded) {
      this.draw(tv.frontCols[e * 2 + w], tv.row, 1, 1, 1)
    }
  }
}
