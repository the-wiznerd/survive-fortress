export class Player extends BaseEntityType {
  type = 'player'

  protected createTraits(world: World, id: EntityId) {
    return [
      new HealthTrait(world, id),
      new HungerTrait(world, id),
      new SpeedTrait(world, id),
      new PlayerControlledTrait(world, id),
    ]
  }
}

registerEntityType(new Player())
