import { Trait } from './Trait.js'

export class HungerTrait extends Trait<'hunger'> {
  readonly component = 'hunger' as const

  defaults(): Hunger {
    return { current: 100, max: 100, drainPerTick: 1 }
  }
}
