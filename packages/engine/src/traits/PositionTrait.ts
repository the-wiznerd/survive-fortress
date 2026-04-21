import { removeFromSpatialIndex, addToSpatialIndex, type Position } from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'

export class PositionTrait extends Trait<'position'> {
  readonly component = 'position' as const
  private _x = 0
  private _y = 0
  private _z = 0

  get x() { return this._x }
  set x(v: number) {
    removeFromSpatialIndex(this.world, this.entityId, this._x, this._y, this._z)
    this._x = v
    addToSpatialIndex(this.world, this.entityId, this._x, this._y, this._z)
  }

  get y() { return this._y }
  set y(v: number) {
    removeFromSpatialIndex(this.world, this.entityId, this._x, this._y, this._z)
    this._y = v
    addToSpatialIndex(this.world, this.entityId, this._x, this._y, this._z)
  }

  get z() { return this._z }
  set z(v: number) {
    removeFromSpatialIndex(this.world, this.entityId, this._x, this._y, this._z)
    this._z = v
    addToSpatialIndex(this.world, this.entityId, this._x, this._y, this._z)
  }

  defaults(): Position {
    return { x: 0, y: 0, z: 0 }
  }

  /** Position always saves all fields — coordinates have no meaningful default. */
  save(): unknown {
    return { x: this._x, y: this._y, z: this._z }
  }
}
