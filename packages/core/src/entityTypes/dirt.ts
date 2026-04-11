export class Dirt implements EntityTypeDef {
  type = 'dirt'

  import(world: World, x: number, y: number, elevation: number, _state: Record<string, unknown>): EntityId {
    const id = createEntity(world)
    addComponent(world, id, 'entityType', { type: 'dirt' })
    addComponent(world, id, 'position', { x, y, elevation })
    addComponent(world, id, 'terrain', { type: 'dirt' })
    return id
  }

  export(_world: World, _id: EntityId): Record<string, unknown> {
    return {}
  }
}

registerEntityType(new Dirt())
