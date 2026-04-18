import type { GroundCover } from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'

export class GroundCoverTrait extends Trait<'groundCover'> {
  readonly component = 'groundCover' as const
  declare cover: string | null

  defaults(): GroundCover {
    return { cover: null }
  }
}
