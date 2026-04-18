import type { Health } from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'

export class HealthTrait extends Trait<'health'> {
  readonly component = 'health' as const
  declare current: number
  declare max: number

  defaults(): Health {
    return { current: 100, max: 100 }
  }
}
