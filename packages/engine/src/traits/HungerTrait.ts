import type { Hunger } from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'

export class HungerTrait extends Trait<'hunger'> {
  readonly component = 'hunger' as const
  declare current: number
  declare max: number
  declare drainPerTick: number

  defaults(): Hunger {
    return { current: 100, max: 100, drainPerTick: 1 }
  }
}
