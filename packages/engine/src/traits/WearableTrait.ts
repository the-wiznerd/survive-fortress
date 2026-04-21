import type { World, EntityId, Wearable } from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'

/**
 * Marks an entity as equippable in a specific named slot on an
 * Equipment-bearing wearer (e.g. 'back' for a bag, 'leftHand' for an axe).
 */
export class WearableTrait extends Trait<'wearable'> {
  readonly component = 'wearable' as const
  declare slot: string

  constructor(world: World, entityId: EntityId, private readonly initial: Partial<Wearable> = {}) {
    super(world, entityId)
  }

  defaults(): Wearable {
    return { slot: 'back', ...this.initial }
  }
}
