export class MoistureTrait extends Trait<'moisture'> {
  readonly component = 'moisture' as const
  declare current: number
  declare capacity: number
  declare rate: number

  constructor(world: World, entityId: EntityId, private overrides: Partial<Moisture> = {}) {
    super(world, entityId)
  }

  defaults(): Moisture {
    return { current: 0, capacity: 100, rate: 10, ...this.overrides }
  }
}
