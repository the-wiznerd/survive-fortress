import type { World, EntityId, Movement, MovementMode } from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'

export class MovementTrait extends Trait<'movement'> {
  readonly component = 'movement' as const
  declare modes: MovementMode[]

  constructor(
    world: World,
    entityId: EntityId,
    private readonly initialModes: MovementMode[] = [{
      locomotion: 'walk', pace: 1
    }],
  ) {
    super(world, entityId)
  }

  defaults(): Movement {
    return { modes: this.initialModes.map(m => ({ ...m })) }
  }
}
