import type { World, EntityId, Harvestable } from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'

export class HarvestableTrait extends Trait<'harvestable'> {
  readonly component = 'harvestable' as const
  declare amount: number

  /**
   * Called by the harvest system when a valid harvester triggers this entity.
   * The entity type sets this in its constructor to define what happens on harvest.
   */
  onHarvest: (harvesterId: EntityId) => void = () => { }

  constructor(world: World, entityId: EntityId, private overrides: Partial<Harvestable> = {}) {
    super(world, entityId)
  }

  defaults(): Harvestable {
    return { amount: 0, ...this.overrides }
  }
}
