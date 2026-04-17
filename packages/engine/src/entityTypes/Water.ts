export class Water extends BaseEntityType {
  type = 'water'
  occluding = this.addTrait(new OccludingTrait(this.world, this.id, { opaque: false }))
  moisture = this.addTrait(new MoistureTrait(this.world, this.id, {
    current: 100,
    capacity: 100,
    conductivity: 50
  }))
}
