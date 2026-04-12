import { BaseEntityType } from '../registry.js'

const GRASS_THRESHOLD = 3

export class Dirt extends BaseEntityType {
  type = 'dirt'

  protected createTraits(world: World, id: EntityId) {
    return [
      new MoistureTrait(world, id, { current: 0, capacity: 50, rate: 1 }),
    ]
  }

  tick(world: World, id: EntityId): void {
    const moisture = getComponent(world, id, 'moisture')
    if (moisture && moisture.current >= GRASS_THRESHOLD) {
      getComponent(world, id, 'entityType')!.type = 'grass'
      world.components.moisture.delete(id)
      this.destroyTraits(id)
    }
  }
}
