export class Player extends BaseEntityType {
  type = 'player'
  health = this.addTrait(new HealthTrait(this.world, this.id))
  hunger = this.addTrait(new HungerTrait(this.world, this.id))
  speed = this.addTrait(new SpeedTrait(this.world, this.id))
  playerControlled = this.addTrait(new PlayerControlledTrait(this.world, this.id))
}
