export class Sand implements EntityTypeDef {
  type = 'sand'

  import(world: World, x: number, y: number, z: number, _state: Record<string, unknown>): EntityId {
    const id = createEntity(world)
    addComponent(world, id, 'entityType', { type: this.type })
    addComponent(world, id, 'position', { x, y, z })
    return id
  }

  export(_world: World, _id: EntityId): Record<string, unknown> {
    return {}
  }
}

registerEntityType(new Sand())
