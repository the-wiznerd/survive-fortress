export class HealthTrait extends Trait<'health'> {
  readonly component = 'health' as const

  defaults(): Health {
    return { current: 100, max: 100 }
  }
}
