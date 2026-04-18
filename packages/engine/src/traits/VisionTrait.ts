import {
  type World,
  type EntityId,
  type Vision,
  getComponent,
  getEntitiesAt
} from '@repo/state'

export class VisionTrait extends Trait<'vision'> {
  readonly component = 'vision' as const
  declare range: number
  declare upward: number

  constructor(world: World, entityId: EntityId, private overrides: Partial<Vision> = {}) {
    super(world, entityId)
  }

  defaults(): Vision {
    return { range: 8, upward: 2, ...this.overrides }
  }

  /** Check whether an opaque entity exists at (x, y, z). */
  private isOpaque(x: number, y: number, z: number): boolean {
    for (const id of getEntitiesAt(this.world, x, y, z)) {
      const occ = getComponent(this.world, id, 'occluding')
      if (occ?.opaque) return true
    }
    return false
  }

  /**
   * True if at least one of N/S/E/W/top neighbors is NOT opaque.
   * A fully enclosed tile (all five faces surrounded) is hidden from view.
   */
  private isExposed(x: number, y: number, z: number): boolean {
    return !this.isOpaque(x - 1, y, z)
      || !this.isOpaque(x + 1, y, z)
      || !this.isOpaque(x, y - 1, z)
      || !this.isOpaque(x, y + 1, z)
      || !this.isOpaque(x, y, z + 1)
  }

  /**
   * Compute the set of visible positions for this entity.
   *
   * Horizontal: all columns within circular `range` of the entity's (x, y).
   *
   * Per column, two vertical searches from entity z (using `upward` as
   * the vertical range in both directions):
   *
   * **Downward:** Walk from entity z toward `entity.z − upward`. Every
   * position (with entities) is visible. The first opaque position is
   * included and stops the search. Non-opaque entities (water) don't stop it.
   *
   * **Upward:** Walk from `entity.z + 1` toward `entity.z + upward`. Non-
   * opaque entities are visible. The first opaque position stops the search
   * and is visible only if it has at least one exposed face (N/S/E/W/top).
   *
   * Returns spatial-key strings "x,y,z".
   */
  getVisiblePositions(): Set<string> {
    const pos = getComponent(this.world, this.entityId, 'position')!
    const { range, upward } = this
    const visible = new Set<string>()
    const r2 = range * range

    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        if (dx * dx + dy * dy > r2) continue

        const wx = pos.x + dx
        const wy = pos.y + dy

        // ── Downward from entity z ──
        // Find the highest occluder at or below entity z. Everything between
        // entity z and that occluder (inclusive) is visible. Non-opaque
        // entities are visible but don't stop the search.
        for (let z = pos.z; z >= pos.z - upward; z--) {
          if (getEntitiesAt(this.world, wx, wy, z).length > 0) {
            visible.add(`${wx},${wy},${z}`)
          }
          if (this.isOpaque(wx, wy, z)) break
        }

        // ── Upward from entity z + 1 ──
        // All non-opaque entities are visible. The first occluder stops the
        // search; it is visible only if at least one face is exposed.
        for (let z = pos.z + 1; z <= pos.z + upward; z++) {
          if (this.isOpaque(wx, wy, z)) {
            if (this.isExposed(wx, wy, z)
              && getEntitiesAt(this.world, wx, wy, z).length > 0) {
              visible.add(`${wx},${wy},${z}`)
            }
            break
          }
          if (getEntitiesAt(this.world, wx, wy, z).length > 0) {
            visible.add(`${wx},${wy},${z}`)
          }
        }
      }
    }

    // Always include the entity itself.
    visible.add(`${pos.x},${pos.y},${pos.z}`)

    return visible
  }

  /** Check whether this entity can see position (x, y, z). */
  canSee(x: number, y: number, z: number): boolean {
    const pos = getComponent(this.world, this.entityId, 'position')!
    const dx = x - pos.x
    const dy = y - pos.y

    if (dx * dx + dy * dy > this.range * this.range) return false
    if (z > pos.z + this.upward || z < pos.z - this.upward) return false

    if (z <= pos.z) {
      // Downward: any occluder between entity z and target blocks visibility.
      for (let cz = pos.z; cz > z; cz--) {
        if (this.isOpaque(x, y, cz)) return false
      }
      return true
    }

    // Upward: any occluder between entity z+1 and target blocks visibility.
    for (let cz = pos.z + 1; cz < z; cz++) {
      if (this.isOpaque(x, y, cz)) return false
    }
    // If the target itself is opaque, it must be exposed.
    if (this.isOpaque(x, y, z)) return this.isExposed(x, y, z)
    return true
  }
}
