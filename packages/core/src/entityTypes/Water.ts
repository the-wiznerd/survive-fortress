export class Water extends BaseEntityType {
  type = 'water'

  protected createTraits(world: World, id: EntityId) {
    return [
      new MoistureTrait(world, id, { current: 100, capacity: 100, rate: 10 }),
    ]
  }
}
