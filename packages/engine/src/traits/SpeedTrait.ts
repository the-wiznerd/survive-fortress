import type { World, EntityId, Speed } from '@repo/state'

export class SpeedTrait extends Trait<'speed'> {
  readonly component = 'speed' as const
  declare pace: number

  timer: TickCounter

  constructor(world: World, entityId: EntityId, private overrides: Partial<Speed> = {}) {
    super(world, entityId)
    const pace = this.overrides.pace ?? 1
    this.timer = this.addSubTrait('timer', new TickCounter(world, entityId, pace))
  }

  defaults(): Speed {
    return { pace: 1, ...this.overrides }
  }
}
