import { BaseEntityType } from '~engine/entityTypes/BaseEntityType.js'
import { CarriableTrait } from '~engine/traits/CarriableTrait.js'
import { WearableTrait } from '~engine/traits/WearableTrait.js'
import { ContainerTrait } from '~engine/traits/ContainerTrait.js'

/**
 * A simple backpack. Wearable in the 'back' slot, carriable on its own, and
 * provides 8 units of container capacity for storing berries and the like.
 */
export class Bag extends BaseEntityType {
  type = 'bag'
  carriable = this.addTrait(new CarriableTrait(this.world, this.id, { size: 4 }))
  wearable = this.addTrait(new WearableTrait(this.world, this.id, { slot: 'back' }))
  container = this.addTrait(new ContainerTrait(this.world, this.id, { capacity: 8 }))
}
