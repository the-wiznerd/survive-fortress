import { BaseEntityType } from '~engine/entityTypes/BaseEntityType.js'
import { OccludingTrait } from '~engine/traits/OccludingTrait.js'

export class Stone extends BaseEntityType {
  type = 'stone'
  occluding = this.addTrait(new OccludingTrait(this.world, this.id))
}
