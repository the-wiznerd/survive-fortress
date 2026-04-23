import type { World, EntityId, Stackable } from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'

/**
 * Lets multiple identical units share one entity instance with a `count`.
 * Container capacity treats this entity as `Carriable.size * count` slots.
 * On transfer into a container with an existing same-typed stack, stacks
 * merge up to `maxStack` and the source entity is destroyed.
 *
 * Default `maxStack` is 1 (effectively un-stackable). Override per entity
 * type to opt in (e.g. berries with `{ maxStack: 20 }`).
 */
export class StackableTrait extends Trait<'stackable'> {
  readonly component = 'stackable' as const
  declare count: number
  declare maxStack: number

  constructor(world: World, entityId: EntityId, private readonly initial: Partial<Stackable> = {}) {
    super(world, entityId)
  }

  defaults(): Stackable {
    return { count: 1, maxStack: 1, ...this.initial }
  }
}
