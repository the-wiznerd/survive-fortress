import { BaseEntityType } from '~engine/entityTypes/BaseEntityType.js'
import { NameTrait } from '~engine/traits/NameTrait.js'
import { HealthTrait } from '~engine/traits/HealthTrait.js'
import { HungerTrait } from '~engine/traits/HungerTrait.js'
import { MovementTrait } from '~engine/traits/MovementTrait.js'
import { VisionTrait } from '~engine/traits/VisionTrait.js'
import { PlayerControlledTrait } from '~engine/traits/PlayerControlledTrait.js'
import { EquipmentTrait } from '~engine/traits/EquipmentTrait.js'
import { spawnEntity } from '~engine/registry.js'
import { equipItem } from '~engine/containment.js'

/** Slot names available on the Player. */
export const PLAYER_SLOTS = ['leftHand', 'rightHand', 'back'] as const

export class Player extends BaseEntityType {
  type = 'player'
  name = this.addTrait(new NameTrait(this.world, this.id))
  health = this.addTrait(new HealthTrait(this.world, this.id))
  hunger = this.addTrait(new HungerTrait(this.world, this.id))
  movement = this.addTrait(new MovementTrait(this.world, this.id, [
    { locomotion: 'walk', pace: 3 }
  ]))
  vision = this.addTrait(new VisionTrait(this.world, this.id, {
    horizontalRange: 20,
    verticalRange: 5
  }))
  playerControlled = this.addTrait(new PlayerControlledTrait(this.world, this.id))
  equipment = this.addTrait(new EquipmentTrait(this.world, this.id, [...PLAYER_SLOTS]))

  /**
   * Fresh players (with no prior saved state) start wearing a Bag. Loaded
   * players keep whatever their save describes — including intentionally-empty
   * slots — because EquipmentTrait always emits an `equipment` key once
   * initialized.
   */
  init(state: Record<string, unknown>): void {
    super.init(state)
    const isFresh = !('equipment' in state)
    if (isFresh && this.equipment.get('back') === null) {
      const bag = spawnEntity(this.world, 'bag', { entityType: 'bag', position: { x: 0, y: 0, z: 0 } })
      equipItem(this.world, bag.id, this.id, 'back')
    }
  }
}

