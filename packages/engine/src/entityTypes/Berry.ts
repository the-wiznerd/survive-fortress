import { BaseEntityType } from '~engine/entityTypes/BaseEntityType.js'
import { CarriableTrait } from '~engine/traits/CarriableTrait.js'
import { EdibleTrait } from '~engine/traits/EdibleTrait.js'
import { StackableTrait } from '~engine/traits/StackableTrait.js'

/**
 * A foraged berry. Carriable, edible, and stacks up to 20 per inventory slot.
 */
export class Berry extends BaseEntityType {
  type = 'berry'
  carriable = this.addTrait(new CarriableTrait(this.world, this.id, { size: 1 }))
  edible = this.addTrait(new EdibleTrait(this.world, this.id, { nutrition: 5 }))
  stackable = this.addTrait(new StackableTrait(this.world, this.id, { maxStack: 20 }))
}
