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
   * Compute the set of visible positions for this entity.
   *
   * Horizontal: all (x, y) within `range` Manhattan-ish (Chebyshev) distance.
   * Vertical: from the lowest z at each (x, y) up to entity.z + upward.
   * Occluding terrain at z blocks visibility of z-1 and below in that column.
   *
   * Returns spatial-key strings "x,y,z" matching the world's spatialIndex format.
   */
  getVisiblePositions(): Set<string> {
    const pos = getComponent(this.world, this.entityId, 'position')!
    const { range, upward } = this
    const visible = new Set<string>()
    const r2 = range * range

    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        // Circular range check.
        if (dx * dx + dy * dy > r2) continue

        const wx = pos.x + dx
        const wy = pos.y + dy
        const maxZ = pos.z + upward

        // Walk column top-down. Once we hit opaque terrain, everything below is hidden.
        for (let z = maxZ; z >= 0; z--) {
          // Check if there are any entities at this position at all.
          const entitiesHere = getEntitiesAt(this.world, wx, wy, z)
          if (entitiesHere.length > 0) {
            visible.add(`${wx},${wy},${z}`)
          }

          // If opaque terrain is here, stop — can't see below.
          if (this.isOpaque(wx, wy, z)) break
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

    // Range check.
    if (dx * dx + dy * dy > this.range * this.range) return false

    // Above upward limit.
    if (z > pos.z + this.upward) return false

    // Column walk: from top down to target z, check for opaque blockers.
    const maxZ = pos.z + this.upward
    for (let cz = maxZ; cz > z; cz--) {
      if (this.isOpaque(x, y, cz)) return false
    }

    return true
  }
}
