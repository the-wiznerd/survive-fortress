import { BaseEntityType } from '~engine/entityTypes/BaseEntityType.js'
import { OccludingTrait } from '~engine/traits/OccludingTrait.js'
import { MaterialTrait } from '~engine/traits/MaterialTrait.js'
import { MoistureTrait } from '~engine/traits/MoistureTrait.js'
import { GroundCoverTrait } from '~engine/traits/GroundCoverTrait.js'
import { dayTicks } from '@repo/state'

const GRASS_THRESHOLD = 3
const GRASS_DELAY = dayTicks(1)

export class Dirt extends BaseEntityType {
  type = 'dirt'
  occluding = this.addTrait(new OccludingTrait(this.world, this.id))
  material = this.addTrait(new MaterialTrait(this.world, this.id, 'solid'))
  moisture = this.addTrait(new MoistureTrait(this.world, this.id, {
    current: 0,
    capacity: 10,
    conductivity: 20
  }))
  groundCover = this.addTrait(new GroundCoverTrait(this.world, this.id))

  private grassCounter = 0

  tick(): void {
    const wet = this.moisture.current >= GRASS_THRESHOLD
    const hasGrass = this.groundCover.cover === 'grass'

    if (wet && !hasGrass) {
      this.grassCounter++
      if (this.grassCounter >= GRASS_DELAY) {
        this.groundCover.cover = 'grass'
        this.grassCounter = 0
      }
    } else if (!wet && hasGrass) {
      this.grassCounter++
      if (this.grassCounter >= GRASS_DELAY) {
        this.groundCover.cover = null
        this.grassCounter = 0
      }
    } else {
      this.grassCounter = 0
    }
  }
}
