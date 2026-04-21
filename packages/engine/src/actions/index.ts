// Action handler registrations + system entry point.
// Importing this module triggers registration of the built-in handlers via side effects.

export * from './registry.js'
export * from './system.js'

import './move.js'
import './wait.js'
import './harvest.js'
import './pickup.js'
import './drop.js'
import './eat.js'
