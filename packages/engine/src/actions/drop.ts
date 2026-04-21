import { getComponent, type Action } from '@repo/state'
import { registerAction } from '~engine/actions/registry.js'
import { removeFromContainer, isHeldByActor } from '~engine/containment.js'

type DropAction = Extract<Action, { type: 'drop' }>

registerAction<DropAction>({
  type: 'drop',
  cost: () => 1,
  validate: (world, actorId, action) => {
    // Item must be (transitively) held by the actor.
    if (!isHeldByActor(world, action.targetId, actorId)) return false
    // Drop offset must land on an adjacent tile (or the actor's own tile).
    if (Math.abs(action.dx) + Math.abs(action.dy) > 1) return false
    const pos = getComponent(world, actorId, 'position')
    return pos !== undefined
  },
  execute: (world, actorId, action) => {
    const pos = getComponent(world, actorId, 'position')!
    removeFromContainer(world, action.targetId, pos.x + action.dx, pos.y + action.dy, pos.z)
  },
})
