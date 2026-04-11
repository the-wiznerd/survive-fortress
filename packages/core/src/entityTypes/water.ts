export class Water implements EntityTypeDef {
  type = 'water'

  import(world: World, x: number, y: number, z: number, _state: Record<string, unknown>): EntityId {
    const id = createEntity(world)
    addComponent(world, id, 'entityType', { type: this.type })
    addComponent(world, id, 'position', { x, y, z })
    addComponent(world, id, 'moisture', { current: 100, threshold: 100 })
    return id
  }

  export(_world: World, _id: EntityId): Record<string, unknown> {
    return {}
  }
}

registerEntityType(new Water())
