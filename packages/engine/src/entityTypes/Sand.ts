import { BaseEntityType } from '~engine/entityTypes/BaseEntityType.js'
import { OccludingTrait } from '~engine/traits/OccludingTrait.js'

export class Sand extends BaseEntityType {
  type = 'sand'
  occluding = this.addTrait(new OccludingTrait(this.world, this.id))
}
