export class NameTrait extends Trait<'name'> {
  readonly component = 'name' as const
  declare name: string

  defaults(): Name {
    return { name: '' }
  }
}
