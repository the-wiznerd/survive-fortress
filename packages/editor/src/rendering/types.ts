/** Sprite sheet: 16×12px cells. */
export const CELL_W = 16
export const CELL_H = 12

/**
 * Terrain variant lookup.
 * topCols: indexed by N*4 + E*2 + W → source column for top face.
 * frontCols: indexed by E*2 + W → source column for front face.
 */
export interface TerrainVariants {
  row: number
  topCols: number[]
  frontCols: number[]
}

const TOP_OFFSETS = [0, 1, 2, 3, 5, 4, 6, 3]
const FRONT_OFFSETS = [9, 8, 10, 7]

export function terrainVariants(row: number, baseCol: number): TerrainVariants {
  return {
    row,
    topCols: TOP_OFFSETS.map(o => baseCol + o),
    frontCols: FRONT_OFFSETS.map(o => baseCol + o),
  }
}
