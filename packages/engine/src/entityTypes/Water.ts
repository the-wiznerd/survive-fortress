import { BaseEntityType } from '~engine/entityTypes/BaseEntityType.js'
import { OccludingTrait } from '~engine/traits/OccludingTrait.js'
import { MaterialTrait } from '~engine/traits/MaterialTrait.js'
import { MoistureTrait } from '~engine/traits/MoistureTrait.js'

export class Water extends BaseEntityType {
  type = 'water'
  occluding = this.addTrait(new OccludingTrait(this.world, this.id, {
    opaque: false
  }))
  material = this.addTrait(new MaterialTrait(this.world, this.id, 'liquid'))
  moisture = this.addTrait(new MoistureTrait(this.world, this.id, {
    current: 100,
    capacity: 100,
    conductivity: 90
  }))
}
