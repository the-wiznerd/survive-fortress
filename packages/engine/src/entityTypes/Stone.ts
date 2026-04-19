import { BaseEntityType } from '~engine/entityTypes/BaseEntityType.js'
import { OccludingTrait } from '~engine/traits/OccludingTrait.js'
import { MaterialTrait } from '~engine/traits/MaterialTrait.js'

export class Stone extends BaseEntityType {
  type = 'stone'
  occluding = this.addTrait(new OccludingTrait(this.world, this.id))
  material = this.addTrait(new MaterialTrait(this.world, this.id, 'solid'))
}
