/** Width of a grid cell in pixels. */
export const CELL_W = 16
/** Height of a sprite-sheet cell (non-terrain). TOP_H + FRONT_H = 2 × CELL_H. */
export const CELL_H = 11
/** Height of a terrain top face and the grid row step. */
export const TOP_H = 12
/** Height of a terrain front (side) face. */
export const FRONT_H = 10
/** Atlas row height — tall enough for either face type. */
export const ATLAS_ROW_H = Math.max(TOP_H, FRONT_H)

export type StaticSprite = { col: number; row: number }
export type AnimatedSprite = { frames: StaticSprite[]; interval: number }

/**
 * Edge variant lookup for terrain with elevation-aware borders.
 * topFaces: indexed by N*4 + E*2 + W (0–7) → { col, row } for top face.
 * frontFaces: indexed by S*4 + E*2 + W (0–7) → { col, row } for front face.
 */
export interface TerrainVariants {
  topFaces: { col: number; row: number }[]
  frontFaces: { col: number; row: number }[]
  unknownTop: { col: number; row: number }
}

/**
 * Column offsets from baseCol for terrain edge variants (all on the same row pair).
 *
 * Top face (8 variants, indexed by N*4 + E*2 + W):
 *   +0 flat, +1 EW, +2 W, +3 E, +4 NEW, +5 NW, +6 N, +7 NE
 *
 * Front face (4 base variants, indexed by E*2 + W, duplicated for S):
 *   Same columns as first 4 top variants: +0 flat, +1 EW, +2 W, +3 E
 *
 * Each row pair is TOP_H + FRONT_H = 22px = 2 × CELL_H.
 * Top face occupies the first TOP_H pixels, front face the remaining FRONT_H.
 */
const TOP_COL_OFFSETS: number[] = [
  0, // flat
  2, // W
  3, // E
  1, // EW
  6, // N
  5, // NW
  7, // NE
  4, // NEW
]
const FRONT_COL_OFFSETS: number[] = [
  0, // flat
  2, // W
  3, // E
  1, // EW
]

/** Top-face edge variant names, indexed by N*4 + E*2 + W. */
export const TOP_VARIANT = {
  FLAT: 0, W: 1, E: 2, EW: 3,
  N: 4, NW: 5, NE: 6, NEW: 7,
} as const

/** Front-face edge variant names, indexed by S*4 + E*2 + W. */
export const FRONT_VARIANT = {
  FLAT: 0, W: 1, E: 2, EW: 3,
  S: 4, SW: 5, SE: 6, SEW: 7,
} as const

/** Build a TerrainVariants from a sprite-sheet row pair and base column. */
export function terrainVariants(baseRow: number, baseCol: number): TerrainVariants {
  const frontFaces = FRONT_COL_OFFSETS.map(dc => ({ col: baseCol + dc, row: baseRow }))
  return {
    topFaces: TOP_COL_OFFSETS.map(dc => ({ col: baseCol + dc, row: baseRow })),
    // Sprite sheets lack S variants — duplicate the 4 base entries for S=1.
    frontFaces: [...frontFaces, ...frontFaces],
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
  /** Min terrain z at each world (x, y). */
  minZ: Map<number, number>
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
      col * CELL_W, row * CELL_H, CELL_W * w, CELL_H * h,
      this.sx * CELL_W, this.sy * TOP_H - this.z * FRONT_H - (h - 1) * CELL_H,
      CELL_W * w, CELL_H * h)
  }

  /** Draw a top face (TOP_H px) from the sprite sheet. row = pair base row in CELL_H grid. */
  drawSheetTop(col: number, row: number, yOff = 0) {
    this.ctx.drawImage(this.sheet,
      col * CELL_W, row * CELL_H, CELL_W, TOP_H,
      this.sx * CELL_W, this.sy * TOP_H - this.z * FRONT_H + yOff * TOP_H,
      CELL_W, TOP_H)
  }

  /** Draw a front face (FRONT_H px) from the sprite sheet. row = pair base row in CELL_H grid. */
  drawSheetFront(col: number, row: number, yOff = 0) {
    this.ctx.drawImage(this.sheet,
      col * CELL_W, row * CELL_H + TOP_H, CELL_W, FRONT_H,
      this.sx * CELL_W, this.sy * TOP_H - this.z * FRONT_H + yOff * TOP_H,
      CELL_W, FRONT_H)
  }

  /** Draw a cell from the generated terrain atlas. */
  drawFromAtlas(col: number, row: number, yOff = 0, h = TOP_H) {
    if (!this.atlas) return
    this.ctx.drawImage(this.atlas,
      col * CELL_W, row * ATLAS_ROW_H, CELL_W, h,
      this.sx * CELL_W, this.sy * TOP_H - this.z * FRONT_H + yOff * TOP_H,
      CELL_W, h)
  }

  get frontOccluded(): boolean {
    if (!this.isKnown(this.wx, this.wy + 1)) return true
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
        this.drawFromAtlas(front.col, front.row, 1, FRONT_H)
      } else {
        this.drawSheetFront(front.col, front.row, 1)
      }
    }
  }
}
