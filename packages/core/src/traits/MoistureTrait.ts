import { Trait } from './Trait.js'

export class MoistureTrait extends Trait<'moisture'> {
  readonly component = 'moisture' as const

  constructor(world: World, entityId: EntityId, private overrides: Partial<Moisture> = {}) {
    super(world, entityId)
  }

  defaults(): Moisture {
    return { current: 0, capacity: 100, rate: 1, ...this.overrides }
  }
}
