import type { Contained } from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'

/**
 * Marks an entity as held inside a container or equipment slot. The parent's
 * traits (Container, Equipment, …) are the source of truth for membership;
 * this is the back-pointer used by helpers and by PositionTrait to delegate
 * coordinates to the holder.
 *
 * Set / cleared exclusively through the containment helpers
 * (`transferToContainer`, `removeFromContainer`) — never written by hand.
 */
export class ContainedTrait extends Trait<'contained'> {
  readonly component = 'contained' as const
  declare parentId: number

  defaults(): Contained {
    return { parentId: 0 }
  }

  /** Skip serialization — containment is rebuilt from the parent's nested save. */
  save(): unknown {
    return undefined
  }
}
