export class SpeedTrait extends Trait<'speed'> {
  readonly component = 'speed' as const
  declare pace: number

  constructor(world: World, entityId: EntityId, private overrides: Partial<Speed> = {}) {
    super(world, entityId)
  }

  defaults(): Speed {
    return { pace: 1, ...this.overrides }
  }
}
