import type { World, EntityId, Actor } from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'

export class ActorTrait extends Trait<'actor'> {
  readonly component = 'actor' as const
  declare pointsPerRound: number

  constructor(world: World, entityId: EntityId, private overrides: Partial<Actor> = {}) {
    super(world, entityId)
  }

  defaults(): Actor {
    return { pointsPerRound: 8, ...this.overrides }
  }
}
