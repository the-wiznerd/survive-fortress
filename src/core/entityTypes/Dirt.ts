const GRASS_THRESHOLD = 3

export class Dirt extends BaseEntityType {
  type = 'dirt'

  protected createTraits(world: World, id: EntityId) {
    return [
      new MoistureTrait(world, id, { current: 0, capacity: 50, rate: 10 }),
    ]
  }

  tick(world: World, id: EntityId): void {
    const moisture = getComponent(world, id, 'moisture')
    if (!moisture || moisture.current < GRASS_THRESHOLD) return

    const pos = getComponent(world, id, 'position')!
    // Don't spawn grass if one already exists above
    const above = getEntitiesAt(world, pos.x, pos.y, pos.z + 1)
    if (above.some(e => getComponent(world, e, 'entityType')?.type === 'grass')) return

    const grassId = createEntity(world)
    getEntityTypeDef('grass')!.import(world, grassId, {
      entityType: 'grass',
      position: { x: pos.x, y: pos.y, z: pos.z + 1 },
    })
  }
}
