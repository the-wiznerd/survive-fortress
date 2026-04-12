const GRASS_THRESHOLD = 3

export class Dirt extends BaseEntityType {
  type = 'dirt'
  moisture = this.addTrait(new MoistureTrait(this.world, this.id, {
    current: 2,
    capacity: 10,
    conductivity: 20
  }))

  tick(): void {
    if (this.moisture.current < GRASS_THRESHOLD) return

    const { x, y, z } = this.position

    // Don't spawn grass if one already exists above
    const above = getEntitiesAt(this.world, x, y, z + 1)
    if (above.some(e => getComponent(this.world, e, 'entityType')?.type === 'grass')) return

    spawnEntity(this.world, 'grass', {
      entityType: 'grass',
      position: { x, y, z: z + 1 },
    })
  }
}
