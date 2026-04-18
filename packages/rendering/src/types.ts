/** Sprite sheet: 16×12px cells. Each cell is one face (top or front). */
export const CELL_W = 16
export const CELL_H = 12

export type StaticSprite = { col: number; row: number }
export type AnimatedSprite = { frames: StaticSprite[]; interval: number }

/**
 * Edge variant lookup for terrain with elevation-aware borders.
 * topFaces: indexed by N*4 + E*2 + W (0–7) → { col, row } for top face.
 * frontFaces: indexed by E*2 + W (0–3) → { col, row } for front face.
 * Variants span two sprite rows (baseRow and baseRow+1).
 */
export interface TerrainVariants {
  topFaces: { col: number; row: number }[]
  frontFaces: { col: number; row: number }[]
  unknownTop: { col: number; row: number }
}

/**
 * Standard layout offsets from base (col, row) for terrain edge variants.
 * Each offset is { dc: column delta, dr: row delta }.
 *
 * Top face (8 variants, indexed by N*4 + E*2 + W):
 *   Row+0: +0 flat, +1 EW, +2 NEW, +3 NW, +4 N, +5 NE
 *   Row+1: +0 W, +1 E
 *
 * Front face (4 variants, indexed by E*2 + W):
 *   Row+1: +4 flat, +3 W, +5 E, +2 EW
 */
const TOP_OFFSETS: [number, number][] = [
  [0, 0], // flat
  [0, 1], // W
  [1, 1], // E
  [1, 0], // EW
  [4, 0], // N
  [3, 0], // NW
  [5, 0], // NE
  [2, 0], // NEW
]
const FRONT_OFFSETS: [number, number][] = [
  [4, 1], // flat
  [3, 1], // W
  [5, 1], // E
  [2, 1], // EW
]

/** Top-face edge variant names, indexed by N*4 + E*2 + W. */
export const TOP_VARIANT = {
  FLAT: 0, W: 1, E: 2, EW: 3,
  N: 4, NW: 5, NE: 6, NEW: 7,
} as const

/** Front-face edge variant names, indexed by E*2 + W. */
export const FRONT_VARIANT = {
  FLAT: 0, W: 1, E: 2, EW: 3,
} as const

/** Build a TerrainVariants from a sprite base row and base column. */
export function terrainVariants(baseRow: number, baseCol: number): TerrainVariants {
  return {
    topFaces: TOP_OFFSETS.map(([dc, dr]) => ({ col: baseCol + dc, row: baseRow + dr })),
    frontFaces: FRONT_OFFSETS.map(([dc, dr]) => ({ col: baseCol + dc, row: baseRow + dr })),
    unknownTop: { col: baseCol + 6, row: baseRow },
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
  /** Set of zKey(x,y) for columns known to be in vision (empty = show all). */
  knownColumns: Set<number>
  /** Player's z coordinate (used for unknown-above check). -Infinity if no vision. */
  playerZ: number
  /** Player's vertical vision range (used for unknown-above check). */
  verticalRange: number
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
    if (this.rc.knownColumns.size === 0) return true
    return this.rc.knownColumns.has(zKey(x, y))
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
    const isTop = this.z === this.rc.maxZ.get(zKey(this.wx, this.wy))
    const aboveUnknown = isTop
      && this.rc.knownColumns.size > 0
      && this.z + 1 > this.rc.playerZ + this.rc.verticalRange
    const top = aboveUnknown ? tv.unknownTop : tv.topFaces[n * 4 + e * 2 + w]
    this.draw(top.col, top.row)
    if (!this.frontOccluded) {
      const front = tv.frontFaces[e * 2 + w]
      this.draw(front.col, front.row, 1, 1, 1)
    }
  }
}
