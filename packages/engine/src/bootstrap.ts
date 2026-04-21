// Core entity type and action handler registrations.
// Called once at startup before any world is loaded.

import { registerEntityType } from '~engine/registry.js'
import { Dirt } from '~engine/entityTypes/Dirt.js'
import { Water } from '~engine/entityTypes/Water.js'
import { Sand } from '~engine/entityTypes/Sand.js'
import { Stone } from '~engine/entityTypes/Stone.js'
import { Player } from '~engine/entityTypes/Player.js'
import { Bush } from '~engine/entityTypes/Bush.js'
import { Berry } from '~engine/entityTypes/Berry.js'
import { Bag } from '~engine/entityTypes/Bag.js'
// Side-effect import: registers built-in action handlers (move, wait, harvest).
import '~engine/actions/index.js'

export function bootstrap() {
  registerEntityType('dirt', Dirt)
  registerEntityType('water', Water)
  registerEntityType('sand', Sand)
  registerEntityType('stone', Stone)
  registerEntityType('player', Player)
  registerEntityType('bush', Bush)
  registerEntityType('berry', Berry)
  registerEntityType('bag', Bag)
}
