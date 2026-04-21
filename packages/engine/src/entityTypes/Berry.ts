import { BaseEntityType } from '~engine/entityTypes/BaseEntityType.js'
import { CarriableTrait } from '~engine/traits/CarriableTrait.js'
import { EdibleTrait } from '~engine/traits/EdibleTrait.js'

/**
 * A foraged berry. Carriable, edible, and occupies 1 slot of container capacity.
 */
export class Berry extends BaseEntityType {
  type = 'berry'
  carriable = this.addTrait(new CarriableTrait(this.world, this.id, { size: 1 }))
  edible = this.addTrait(new EdibleTrait(this.world, this.id, { nutrition: 5 }))
}
