import type { PlayerControlled, Action } from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'

export class PlayerControlledTrait extends Trait<'playerControlled'> {
  readonly component = 'playerControlled' as const
  declare plan: Action[]
  declare planIndex: number
  declare actionTicksElapsed: number

  defaults(): PlayerControlled {
    return { plan: [], planIndex: 0, actionTicksElapsed: 0 }
  }
}
