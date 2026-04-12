const GRASS_THRESHOLD = 3

export class Dirt extends BaseEntityType {
  type = 'dirt'
  moisture = this.addTrait(new MoistureTrait(this.world, this.id, { current: 0, capacity: 50, rate: 10 }))

  tick(): void {
    if (this.moisture.data.current < GRASS_THRESHOLD) return

    const pos = this.position.data

    // Don't spawn grass if one already exists above
    const above = getEntitiesAt(this.world, pos.x, pos.y, pos.z + 1)
    if (above.some(e => getComponent(this.world, e, 'entityType')?.type === 'grass')) return

    spawnEntity(this.world, 'grass', {
      entityType: 'grass',
      position: { x: pos.x, y: pos.y, z: pos.z + 1 },
    })
  }
}
