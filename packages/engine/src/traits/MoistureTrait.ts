import type { World, EntityId, Moisture } from '@repo/state'

export class MoistureTrait extends Trait<'moisture'> {
  readonly component = 'moisture' as const
  declare current: number
  declare capacity: number
  declare conductivity: number

  constructor(world: World, entityId: EntityId, private overrides: Partial<Moisture> = {}) {
    super(world, entityId)
  }

  defaults(): Moisture {
    return { current: 0, capacity: 100, conductivity: 10, ...this.overrides }
  }
}
