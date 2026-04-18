/** Width of a grid cell in pixels. */
export const CELL_W = 16
/** Height of a sprite-sheet cell (used for non-terrain sprite source). */
export const CELL_H = 12
/** Height of a terrain top face and the grid row step. */
export const TOP_H = 12
/** Height of a terrain front (side) face. */
export const FRONT_H = 12
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
 * Standard layout offsets from base (col, row) for terrain edge variants.
 * Each offset is { dc: column delta, dr: row delta }.
 *
 * Top face (8 variants, indexed by N*4 + E*2 + W):
 *   Row+0: +0 flat, +1 EW, +2 NEW, +3 NW, +4 N, +5 NE
 *   Row+1: +0 W, +1 E
 *
 * Front face (8 variants, indexed by S*4 + E*2 + W):
 *   Row+1: +4 flat, +3 W, +5 E, +2 EW (sprite sheet lacks S variants)
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

/** Front-face edge variant names, indexed by S*4 + E*2 + W. */
export const FRONT_VARIANT = {
  FLAT: 0, W: 1, E: 2, EW: 3,
  S: 4, SW: 5, SE: 6, SEW: 7,
} as const

/** Build a TerrainVariants from a sprite base row and base column. */
export function terrainVariants(baseRow: number, baseCol: number): TerrainVariants {
  const frontFaces = FRONT_OFFSETS.map(([dc, dr]) => ({ col: baseCol + dc, row: baseRow + dr }))
  return {
    topFaces: TOP_OFFSETS.map(([dc, dr]) => ({ col: baseCol + dc, row: baseRow + dr })),
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

  draw(col: number, row: number, w = 1, h = 1, yOff = 0) {
    this.ctx.drawImage(this.sheet,
      col * CELL_W, row * CELL_H, CELL_W * w, CELL_H * h,
      this.sx * CELL_W, this.sy * TOP_H - this.z * FRONT_H + yOff * TOP_H,
      CELL_W * w, CELL_H * h)
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
      this.draw(top.col, top.row)
    }
    if (!this.frontOccluded) {
      const front = tv.frontFaces[s * 4 + e * 2 + w]
      if (fromAtlas) {
        this.drawFromAtlas(front.col, front.row, 1, FRONT_H)
      } else {
        this.draw(front.col, front.row, 1, 1, 1)
      }
    }
  }
}
