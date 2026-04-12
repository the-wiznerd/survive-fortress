export class Water extends BaseEntityType {
  type = 'water'
  moisture = this.addTrait(new MoistureTrait(this.world, this.id, { current: 100, capacity: 100, rate: 50 }))
}
