import { getComponent, type Action, type World, type EntityId } from '@repo/state'
import { registerAction } from '~engine/actions/registry.js'
import { destroyEntity, isHeldByActor } from '~engine/containment.js'

type EatAction = Extract<Action, { type: 'eat' }>

/** Eatable if the target is held by the actor OR adjacent on the same z-plane. */
function canReach(world: World, actorId: EntityId, targetId: EntityId): boolean {
  if (isHeldByActor(world, targetId, actorId)) return true
  const a = getComponent(world, actorId, 'position')
  const b = getComponent(world, targetId, 'position')
  if (!a || !b) return false
  return a.z === b.z && Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1
}

registerAction<EatAction>({
  type: 'eat',
  cost: () => 1,
  validate: (world, actorId, action) => {
    const edible = getComponent(world, action.targetId, 'edible')
    if (!edible) return false
    if (!getComponent(world, actorId, 'hunger')) return false
    return canReach(world, actorId, action.targetId)
  },
  execute: (world, actorId, action) => {
    const edible = getComponent(world, action.targetId, 'edible')!
    const hunger = getComponent(world, actorId, 'hunger')!
    hunger.current = Math.min(hunger.max, hunger.current + edible.nutrition)
    // Stacked items decrement the stack; only destroy when the last unit is consumed.
    const stack = getComponent(world, action.targetId, 'stackable')
    if (stack && stack.count > 1) {
      stack.count -= 1
      return
    }
    destroyEntity(world, action.targetId)
  },
})
