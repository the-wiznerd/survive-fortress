import { type World, type Action, queryEntities, getComponent } from './ecs.js'
import { getEntityTypeDef } from './registry.js'

export type System = (world: World) => void

// ─── Systems ───

/** Process AP accumulation and movement for entities with speed + position. */
export const movementSystem: System = (world) => {
  const MOVE_COST = 10

  for (const id of queryEntities(world, 'speed', 'position')) {
    const speed = getComponent(world, id, 'speed')!
    speed.ap += speed.apPerTick

    // Determine desired move.
    let action: Action | null = null

    const pc = getComponent(world, id, 'playerControlled')
    if (pc) {
      action = pc.pendingAction
      pc.pendingAction = null
    }

    // Execute movement if we have enough AP.
    if (action?.type === 'move' && speed.ap >= MOVE_COST) {
      const pos = getComponent(world, id, 'position')!
      pos.x += action.dx
      pos.y += action.dy
      speed.ap -= MOVE_COST
    }
  }
}

/** Drain hunger each tick. At 0 hunger, drain health. */
export const hungerSystem: System = (world) => {
  for (const id of queryEntities(world, 'hunger')) {
    const hunger = getComponent(world, id, 'hunger')!
    hunger.current = Math.max(0, hunger.current - hunger.drainPerTick)

    if (hunger.current === 0) {
      const health = getComponent(world, id, 'health')
      if (health) {
        health.current = Math.max(0, health.current - 1)
      }
    }
  }
}

/** Run entity-type-specific tick logic for all typed entities. */
export const entityTypeTickSystem: System = (world) => {
  for (const id of queryEntities(world, 'entityType')) {
    const typeName = getComponent(world, id, 'entityType')!.type
    const def = getEntityTypeDef(typeName)
    if (def?.tick) {
      def.tick(world, id)
    }
  }
}

// ─── Tick Engine ───

const defaultSystems: System[] = [movementSystem, hungerSystem, entityTypeTickSystem]

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
