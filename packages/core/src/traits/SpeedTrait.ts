export class SpeedTrait extends Trait<'speed'> {
  readonly component = 'speed' as const

  defaults(): Speed {
    return { ap: 0, apPerTick: 10 }
  }
}
