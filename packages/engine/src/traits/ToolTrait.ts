import type { World, EntityId, Tool } from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'

/**
 * Capability marker — names the action affordances this item unlocks or
 * accelerates. Consumers check their carrier's tools for matching affordances
 * (e.g. 'chop' for an axe). Having a tool is never required to attempt an
 * action — it makes the action possible or faster.
 */
export class ToolTrait extends Trait<'tool'> {
  readonly component = 'tool' as const
  declare affordances: string[]

  constructor(world: World, entityId: EntityId, private readonly initial: Partial<Tool> = {}) {
    super(world, entityId)
  }

  defaults(): Tool {
    return { affordances: [], ...this.initial }
  }
}
