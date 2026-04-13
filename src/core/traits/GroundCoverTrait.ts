export class GroundCoverTrait extends Trait<'groundCover'> {
  readonly component = 'groundCover' as const
  declare cover: string | null

  defaults(): GroundCover {
    return { cover: null }
  }
}
