export class HealthTrait extends Trait<'health'> {
  readonly component = 'health' as const
  declare current: number
  declare max: number

  defaults(): Health {
    return { current: 100, max: 100 }
  }
}
