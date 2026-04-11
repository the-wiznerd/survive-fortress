const MOISTURE_THRESHOLD = 3

export class Dirt implements EntityTypeDef {
  type = 'dirt'

  import(world: World, x: number, y: number, z: number, state: Record<string, unknown>): EntityId {
    const id = createEntity(world)
    addComponent(world, id, 'entityType', { type: this.type })
    addComponent(world, id, 'position', { x, y, z })
    addComponent(world, id, 'moisture', {
      current: (state.moisture as number) ?? 0,
      threshold: MOISTURE_THRESHOLD,
    })
    return id
  }

  export(world: World, id: EntityId): Record<string, unknown> {
    const moisture = getComponent(world, id, 'moisture')
    return moisture && moisture.current > 0 ? { moisture: moisture.current } : {}
  }

  tick(world: World, id: EntityId): void {
    const pos = getComponent(world, id, 'position')!
    const moisture = getComponent(world, id, 'moisture')!

    // Check orthogonal neighbors for entities with moisture.
    const neighbors = [
      [pos.x - 1, pos.y],
      [pos.x + 1, pos.y],
      [pos.x, pos.y - 1],
      [pos.x, pos.y + 1],
    ]
    const hasMoistNeighbor = neighbors.some(([nx, ny]) =>
      getEntitiesAt(world, nx, ny, pos.z).some(nid => {
        const m = getComponent(world, nid, 'moisture')
        return m !== undefined && m.current > 0
      })
    )

    if (hasMoistNeighbor) {
      moisture.current++
    }

    if (moisture.current >= moisture.threshold) {
      // Convert to grass: swap entityType, remove moisture.
      getComponent(world, id, 'entityType')!.type = 'grass'
      world.components.moisture.delete(id)
    }
  }
}

registerEntityType(new Dirt())
