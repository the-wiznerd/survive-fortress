import { BaseEntityType } from '~engine/entityTypes/BaseEntityType.js'
import { NameTrait } from '~engine/traits/NameTrait.js'
import { HealthTrait } from '~engine/traits/HealthTrait.js'
import { HungerTrait } from '~engine/traits/HungerTrait.js'
import { MovementTrait } from '~engine/traits/MovementTrait.js'
import { VisionTrait } from '~engine/traits/VisionTrait.js'
import { PlayerControlledTrait } from '~engine/traits/PlayerControlledTrait.js'

export class Player extends BaseEntityType {
  type = 'player'
  name = this.addTrait(new NameTrait(this.world, this.id))
  health = this.addTrait(new HealthTrait(this.world, this.id))
  hunger = this.addTrait(new HungerTrait(this.world, this.id))
  movement = this.addTrait(new MovementTrait(this.world, this.id, [
    { locomotion: 'walk', pace: 1 }
  ]))
  vision = this.addTrait(new VisionTrait(this.world, this.id, {
    horizontalRange: 20,
    verticalRange: 2
  }))
  playerControlled = this.addTrait(new PlayerControlledTrait(this.world, this.id))
}
