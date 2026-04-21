import { removeFromSpatialIndex, addToSpatialIndex, getComponent, type Position } from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'
import { moveContainedChildren } from '~engine/containment.js'

/**
 * An entity's location in the world.
 *
 * Contained entities (those with a `Contained` component) don't store their own
 * coordinates — getters delegate to the parent's PositionTrait. Their setters
 * are inert: a held berry is moved by moving its carrier, not by writing to
 * the berry's position. Spatial-index entries for held items are kept in sync
 * by `containment.ts` whenever a carrier's position changes or a transfer occurs.
 */
export class PositionTrait extends Trait<'position'> {
  readonly component = 'position' as const
  private _x = 0
  private _y = 0
  private _z = 0

  private get parentPos(): Position | undefined {
    const c = getComponent(this.world, this.entityId, 'contained')
    if (!c) return undefined
    return getComponent(this.world, c.parentId, 'position')
  }

  get x() { return this.parentPos?.x ?? this._x }
  set x(v: number) {
    if (this.parentPos) return // contained entities don't have independent coordinates
    const ox = this._x, oy = this._y, oz = this._z
    removeFromSpatialIndex(this.world, this.entityId, ox, oy, oz)
    this._x = v
    addToSpatialIndex(this.world, this.entityId, this._x, this._y, this._z)
    moveContainedChildren(this.world, this.entityId, ox, oy, oz, this._x, this._y, this._z)
  }

  get y() { return this.parentPos?.y ?? this._y }
  set y(v: number) {
    if (this.parentPos) return
    const ox = this._x, oy = this._y, oz = this._z
    removeFromSpatialIndex(this.world, this.entityId, ox, oy, oz)
    this._y = v
    addToSpatialIndex(this.world, this.entityId, this._x, this._y, this._z)
    moveContainedChildren(this.world, this.entityId, ox, oy, oz, this._x, this._y, this._z)
  }

  get z() { return this.parentPos?.z ?? this._z }
  set z(v: number) {
    if (this.parentPos) return
    const ox = this._x, oy = this._y, oz = this._z
    removeFromSpatialIndex(this.world, this.entityId, ox, oy, oz)
    this._z = v
    addToSpatialIndex(this.world, this.entityId, this._x, this._y, this._z)
    moveContainedChildren(this.world, this.entityId, ox, oy, oz, this._x, this._y, this._z)
  }

  defaults(): Position {
    return { x: 0, y: 0, z: 0 }
  }

  /** Free entities always serialize their coordinates. Contained entities skip — their position derives from their carrier. */
  save(): unknown {
    if (getComponent(this.world, this.entityId, 'contained')) return undefined
    return { x: this._x, y: this._y, z: this._z }
  }
}
