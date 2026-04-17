import type { World, EntityId, Occluding } from '@repo/state'

export class OccludingTrait extends Trait<'occluding'> {
  readonly component = 'occluding' as const
  declare opaque: boolean

  constructor(world: World, entityId: EntityId, private overrides: Partial<Occluding> = {}) {
    super(world, entityId)
  }

  defaults(): Occluding {
    return { opaque: true, ...this.overrides }
  }
}
