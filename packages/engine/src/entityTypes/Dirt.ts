import { BaseEntityType } from '~engine/entityTypes/BaseEntityType.js'
import { OccludingTrait } from '~engine/traits/OccludingTrait.js'
import { MaterialTrait } from '~engine/traits/MaterialTrait.js'
import { MoistureTrait } from '~engine/traits/MoistureTrait.js'
import { GroundCoverTrait } from '~engine/traits/GroundCoverTrait.js'

const GRASS_THRESHOLD = 3

export class Dirt extends BaseEntityType {
  type = 'dirt'
  occluding = this.addTrait(new OccludingTrait(this.world, this.id))
  material = this.addTrait(new MaterialTrait(this.world, this.id, 'solid'))
  moisture = this.addTrait(new MoistureTrait(this.world, this.id, {
    current: 2,
    capacity: 12,
    conductivity: 48
  }))
  groundCover = this.addTrait(new GroundCoverTrait(this.world, this.id))

  tick(): void {
    if (this.moisture.current >= GRASS_THRESHOLD) {
      this.groundCover.cover = 'grass'
    } else {
      this.groundCover.cover = null
    }
  }
}
