import type { World } from '@repo/state'
// Importing from the actions barrel registers built-in action handlers as a side effect.
import { actionSystem } from '~engine/actions/index.js'
import { hungerSystem } from '~engine/systems/hunger.js'
import { moistureSystem } from '~engine/systems/moisture.js'
import { entityTypeTickSystem } from '~engine/systems/entityTypeTick.js'

export type System = (world: World) => void

// ─── Tick Engine ───

const defaultSystems: System[] = [actionSystem, hungerSystem, moistureSystem, entityTypeTickSystem]

export function tick(world: World, systems: System[] = defaultSystems): void {
  for (const system of systems) {
    system(world)
  }
  world.tick++
}

/** Run multiple ticks. */
export function simulate(
  world: World,
  ticks: number,
  systems?: System[],
): void {
  for (let i = 0; i < ticks; i++) {
    tick(world, systems)
  }
}
