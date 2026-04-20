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
