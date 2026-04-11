export class Player implements EntityTypeDef {
  type = 'player'

  import(world: World, x: number, y: number, z: number, state: Record<string, unknown>): EntityId {
    const id = createEntity(world)
    addComponent(world, id, 'entityType', { type: 'player' })
    addComponent(world, id, 'position', { x, y, z })
    addComponent(world, id, 'health', { current: 100, max: 100 })
    addComponent(world, id, 'hunger', { current: 100, max: 100, drainPerTick: 1 })
    addComponent(world, id, 'speed', { ap: 0, apPerTick: 10 })
    addComponent(world, id, 'playerControlled', { pendingAction: null })
    // Override defaults from saved state if present.
    importComponents(world, id, state, 'health', 'hunger', 'speed')
    return id
  }

  export(world: World, id: EntityId): Record<string, unknown> {
    return exportComponents(world, id, 'health', 'hunger', 'speed')
  }
}

registerEntityType(new Player())
