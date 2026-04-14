export class PlayerControlledTrait extends Trait<'playerControlled'> {
  readonly component = 'playerControlled' as const
  declare pendingAction: Action | null

  defaults(): PlayerControlled {
    return { pendingAction: null }
  }
}
