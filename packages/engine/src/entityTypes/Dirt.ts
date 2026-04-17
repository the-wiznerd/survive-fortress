const GRASS_THRESHOLD = 3

export class Dirt extends BaseEntityType {
  type = 'dirt'
  occluding = this.addTrait(new OccludingTrait(this.world, this.id))
  moisture = this.addTrait(new MoistureTrait(this.world, this.id, {
    current: 2,
    capacity: 10,
    conductivity: 20
  }))
  groundCover = this.addTrait(new GroundCoverTrait(this.world, this.id))

  tick(): void {
    if (this.moisture.current >= GRASS_THRESHOLD) {
      this.groundCover.cover = 'grass'
    } else {
      this.groundCover.cover = null
    }
  }
}
