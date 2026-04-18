import type { World, EntityId, Movement } from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'
import { TickCounter } from '~engine/traits/TickCounter.js'

export class MovementTrait extends Trait<'movement'> {
  readonly component = 'movement' as const
  declare pace: number

  timer: TickCounter

  constructor(world: World, entityId: EntityId, private overrides: Partial<Movement> = {}) {
    super(world, entityId)
    const pace = this.overrides.pace ?? 1
    this.timer = this.addSubTrait('timer', new TickCounter(world, entityId, pace))
  }

  defaults(): Movement {
    return { pace: 1, ...this.overrides }
  }
}
