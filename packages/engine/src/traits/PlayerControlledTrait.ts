import type { PlayerControlled, Action } from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'

export class PlayerControlledTrait extends Trait<'playerControlled'> {
  readonly component = 'playerControlled' as const
  declare plan: Action[]
  declare planIndex: number

  defaults(): PlayerControlled {
    return { plan: [], planIndex: 0 }
  }
}
