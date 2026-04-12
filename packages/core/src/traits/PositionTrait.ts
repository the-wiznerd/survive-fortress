export class PositionTrait extends Trait<'position'> {
  readonly component = 'position' as const

  defaults(): Position {
    return { x: 0, y: 0, z: 0 }
  }
}
