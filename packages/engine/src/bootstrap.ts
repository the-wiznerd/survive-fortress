// Core entity type registrations.
// Called once at startup before any world is loaded.

import { registerEntityType } from '~engine/registry.js'
import { Dirt } from '~engine/entityTypes/Dirt.js'
import { Water } from '~engine/entityTypes/Water.js'
import { Sand } from '~engine/entityTypes/Sand.js'
import { Stone } from '~engine/entityTypes/Stone.js'
import { Player } from '~engine/entityTypes/Player.js'

export function bootstrap() {
  registerEntityType('dirt', Dirt)
  registerEntityType('water', Water)
  registerEntityType('sand', Sand)
  registerEntityType('stone', Stone)
  registerEntityType('player', Player)
}
