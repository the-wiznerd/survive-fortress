import { queryEntities, getComponent, type World } from '@repo/state'
import { getActionHandler } from '~engine/actions/registry.js'

/**
 * Drives plan execution for player-controlled entities.
 *
 * Each tick, for each player-controlled entity:
 *   - If the plan is exhausted, idle.
 *   - Otherwise, consult the registered handler for the current action.
 *   - Pay one tick toward the action's cost; on completion, execute and advance.
 *   - On any validation failure, terminate the plan (drop remaining actions).
 *
 * Only one action progresses per entity per tick.
 */
export function actionSystem(world: World) {
  for (const id of queryEntities(world, 'playerControlled')) {
    const pc = getComponent(world, id, 'playerControlled')!
    if (pc.planTerminated || pc.planIndex >= pc.plan.length) continue

    const action = pc.plan[pc.planIndex]!
    const handler = getActionHandler(action.type)
    if (!handler) {
      terminatePlan(pc)
      continue
    }

    if (!handler.validate(world, id, action)) {
      terminatePlan(pc)
      continue
    }

    const cost = handler.cost(world, id, action)
    pc.actionTicksElapsed++

    if (pc.actionTicksElapsed >= cost) {
      // Re-validate at completion — world state may have changed during the action's duration.
      if (handler.validate(world, id, action)) {
        handler.execute(world, id, action)
        pc.actionTicksElapsed = 0
        pc.planIndex++
      } else {
        terminatePlan(pc)
      }
    }
  }
}

/** Mark the plan terminated. `planIndex` is left pointing at the failing action
 *  so views/UI can identify which one didn't resolve. */
function terminatePlan(pc: { plan: unknown[]; planIndex: number; actionTicksElapsed: number; planTerminated: boolean }): void {
  pc.actionTicksElapsed = 0
  pc.planTerminated = true
}
