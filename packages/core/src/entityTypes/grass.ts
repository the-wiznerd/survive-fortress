export class Grass implements EntityTypeDef {
  type = 'grass'

  import(world: World, x: number, y: number, z: number, _state: Record<string, unknown>): EntityId {
    const id = createEntity(world)
    addComponent(world, id, 'entityType', { type: 'grass' })
    addComponent(world, id, 'position', { x, y, z })
    return id
  }

  export(_world: World, _id: EntityId): Record<string, unknown> {
    return {}
  }
}

registerEntityType(new Grass())
