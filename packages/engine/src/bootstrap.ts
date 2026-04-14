// Core entity type registrations.
// Called once at startup before any world is loaded.

export function bootstrap() {
  registerEntityType('dirt', Dirt)
  registerEntityType('water', Water)
  registerEntityType('sand', Sand)
  registerEntityType('stone', Stone)
  registerEntityType('player', Player)
}
