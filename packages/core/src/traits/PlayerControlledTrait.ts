import { Trait } from './Trait.js'

export class PlayerControlledTrait extends Trait<'playerControlled'> {
  readonly component = 'playerControlled' as const

  defaults(): PlayerControlled {
    return { pendingAction: null }
  }
}
