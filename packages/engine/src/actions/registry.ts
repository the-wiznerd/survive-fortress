import type { World, EntityId, Action } from '@repo/state'

/**
 * Encapsulates the lifecycle of a single action type.
 *
 * The `actionSystem` calls `validate` before paying any ticks (cheap fail-fast),
 * then ticks `cost` simulation steps before re-validating and calling `execute`.
 * If validation fails at either point, the actor's plan terminates.
 */
export interface ActionHandler<A extends Action = Action> {
  type: A['type']
  /** Cost in ticks. Must be >= 1. Computed at action start from current world state. */
  cost(world: World, actorId: EntityId, action: A): number
  /** Whether the action is currently legal. Checked at start and again at completion. */
  validate(world: World, actorId: EntityId, action: A): boolean
  /** Apply the action's effects. Called once per action, after `cost` ticks have elapsed. */
  execute(world: World, actorId: EntityId, action: A): void
}

const handlers = new Map<string, ActionHandler>()

export function registerAction<A extends Action>(handler: ActionHandler<A>): void {
  handlers.set(handler.type, handler as unknown as ActionHandler)
}

export function getActionHandler(type: string): ActionHandler | undefined {
  return handlers.get(type)
}
