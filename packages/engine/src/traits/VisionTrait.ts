import {
  type World,
  type EntityId,
  type Vision,
  getComponent,
  getEntitiesAt
} from '@repo/state'

export class VisionTrait extends Trait<'vision'> {
  readonly component = 'vision' as const
  declare horizontalRange: number
  declare verticalRange: number

  constructor(world: World, entityId: EntityId, private overrides: Partial<Vision> = {}) {
    super(world, entityId)
  }

  defaults(): Vision {
    return { horizontalRange: 8, verticalRange: 2, ...this.overrides }
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
   * True if at least one cardinal neighbor (N/S/E/W) is NOT opaque.
   * Used to decide if an occluded tile has a visible face.
   */
  private isSideExposed(x: number, y: number, z: number): boolean {
    return !this.isOpaque(x - 1, y, z)
      || !this.isOpaque(x + 1, y, z)
      || !this.isOpaque(x, y - 1, z)
      || !this.isOpaque(x, y + 1, z)
  }

  /**
   * Compute the set of visible positions for this entity.
   *
   * Horizontal: all columns within circular `horizontalRange` of the entity's
   * (x, y).
   *
   * Per column, two vertical walks from entity z bounded by `verticalRange`.
   * Each walk has a **clear phase** (before the first occluder) and a
   * **cliff-face phase** (after it).
   *
   * **Downward (entity z → entity.z − verticalRange):**
   * - Clear: all positions with entities are visible. First opaque → cliff-face.
   * - Cliff-face: only opaque tiles with an exposed side face (N/S/E/W).
   *
   * **Upward (entity.z + 1 → entity.z + verticalRange):**
   * - Clear: non-opaque entities are visible. First opaque is always
   *   included, then → cliff-face.
   * - Cliff-face: same as downward.
   *
   * Returns spatial-key strings "x,y,z".
   */
  getVisiblePositions(): Set<string> {
    const pos = getComponent(this.world, this.entityId, 'position')!
    const { horizontalRange, verticalRange } = this
    const visible = new Set<string>()
    const r2 = horizontalRange * horizontalRange

    for (let dx = -horizontalRange; dx <= horizontalRange; dx++) {
      for (let dy = -horizontalRange; dy <= horizontalRange; dy++) {
        if (dx * dx + dy * dy > r2) continue

        const wx = pos.x + dx
        const wy = pos.y + dy

        // ── Downward from entity z ──
        // Everything above the first occluder is fully visible. Once we hit
        // an occluder, continue in "cliff-face" mode: only add tiles with
        // at least one exposed side face (N/S/E/W).
        let occluded = false
        for (let z = pos.z; z >= pos.z - verticalRange; z--) {
          const hasEntities = getEntitiesAt(this.world, wx, wy, z).length > 0
          const opaque = this.isOpaque(wx, wy, z)

          if (!occluded) {
            if (hasEntities) visible.add(`${wx},${wy},${z}`)
            if (opaque) occluded = true
          } else if (opaque && hasEntities && this.isSideExposed(wx, wy, z)) {
            visible.add(`${wx},${wy},${z}`)
          }
        }

        // ── Upward from entity z + 1 ──
        // Before the first occluder: non-opaque entities visible freely,
        // first opaque visible only if exposed. After the first occluder,
        // cliff-face mode: only opaque tiles with an exposed side face.
        let upOccluded = false
        for (let z = pos.z + 1; z <= pos.z + verticalRange; z++) {
          const hasEntities = getEntitiesAt(this.world, wx, wy, z).length > 0
          const opaque = this.isOpaque(wx, wy, z)

          if (!upOccluded) {
            if (opaque) {
              if (hasEntities) visible.add(`${wx},${wy},${z}`)
              upOccluded = true
            } else if (hasEntities) {
              visible.add(`${wx},${wy},${z}`)
            }
          } else if (opaque && hasEntities && this.isSideExposed(wx, wy, z)) {
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

    if (dx * dx + dy * dy > this.horizontalRange * this.horizontalRange) return false
    if (z > pos.z + this.verticalRange || z < pos.z - this.verticalRange) return false

    if (z <= pos.z) {
      // Downward: check if any occluder blocks before the target.
      for (let cz = pos.z; cz > z; cz--) {
        if (this.isOpaque(x, y, cz)) {
          // Occluded — target visible only if opaque with an exposed side face.
          return this.isOpaque(x, y, z) && this.isSideExposed(x, y, z)
        }
      }
      return true
    }

    // Upward: any occluder between entity z+1 and target blocks visibility,
    // unless target is opaque with an exposed side face (cliff-face).
    for (let cz = pos.z + 1; cz < z; cz++) {
      if (this.isOpaque(x, y, cz)) {
        return this.isOpaque(x, y, z) && this.isSideExposed(x, y, z)
      }
    }
    // If the target itself is opaque, it's always visible (first occluder).
    if (this.isOpaque(x, y, z)) return true
    return true
  }
}
