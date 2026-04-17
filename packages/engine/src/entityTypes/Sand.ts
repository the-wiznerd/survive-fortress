export class Sand extends BaseEntityType {
  type = 'sand'
  occluding = this.addTrait(new OccludingTrait(this.world, this.id))
}
