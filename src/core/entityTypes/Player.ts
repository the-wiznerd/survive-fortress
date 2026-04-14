export class Player extends BaseEntityType {
  type = 'player'
  name = this.addTrait(new NameTrait(this.world, this.id))
  health = this.addTrait(new HealthTrait(this.world, this.id))
  hunger = this.addTrait(new HungerTrait(this.world, this.id))
  speed = this.addTrait(new SpeedTrait(this.world, this.id, { pace: 3 }))
  playerControlled = this.addTrait(new PlayerControlledTrait(this.world, this.id))
}
