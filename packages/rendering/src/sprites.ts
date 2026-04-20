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
