import type { World, EntityId, Edible } from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'

/**
 * Marks an entity as edible. Eating it consumes the entity and raises the
 * eater's Hunger.current by `nutrition` (clamped to Hunger.max).
 */
export class EdibleTrait extends Trait<'edible'> {
  readonly component = 'edible' as const
  declare nutrition: number

  constructor(world: World, entityId: EntityId, private readonly initial: Partial<Edible> = {}) {
    super(world, entityId)
  }

  defaults(): Edible {
    return { nutrition: 5, ...this.initial }
  }
}
