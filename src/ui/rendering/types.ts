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
  world: World
  /** Max terrain z at each world (x, y). */
  maxZ: Map<number, number>
  /** Set of packed (x, y, z) keys where terrain exists. */
  terrainAt: Set<number>
  /** Current timestamp from performance.now(). */
  now: number
}

/** Hashed key for (x, y) elevation lookups. */
export function zKey(x: number, y: number): number {
  return y * 100000 + x
}

/** Packed key for (x, y, z) terrain presence lookups. */
export function posKey(x: number, y: number, z: number): number {
  return ((z + 128) << 20) | ((y & 0x3FF) << 10) | (x & 0x3FF)
}
