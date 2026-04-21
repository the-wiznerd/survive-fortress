import type { World, EntityId, Carriable } from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'

/**
 * Marks an entity as something that can be picked up and stored in a container.
 *
 * `size` is measured in abstract container slots — a berry might be 1, a stone 3,
 * an axe 5. Containers reject items whose size exceeds their remaining capacity.
 */
export class CarriableTrait extends Trait<'carriable'> {
  readonly component = 'carriable' as const
  declare size: number

  constructor(world: World, entityId: EntityId, private readonly initial: Partial<Carriable> = {}) {
    super(world, entityId)
  }

  defaults(): Carriable {
    return { size: 1, ...this.initial }
  }
}
