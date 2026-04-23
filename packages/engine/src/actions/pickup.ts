import { getComponent, type Action, type World, type EntityId } from '@repo/state'
import { registerAction } from '~engine/actions/registry.js'
import { transferToContainer, getActorContainer, getContainerUsedCapacity, effectiveCarriableSize } from '~engine/containment.js'

type PickupAction = Extract<Action, { type: 'pickup' }>

/** Manhattan distance ≤ 1 on the same z-plane. Zero distance counts (the tile under the actor). */
function isAdjacent(world: World, actorId: EntityId, targetId: EntityId): boolean {
  const a = getComponent(world, actorId, 'position')
  const b = getComponent(world, targetId, 'position')
  if (!a || !b) return false
  return a.z === b.z && Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1
}

registerAction<PickupAction>({
  type: 'pickup',
  cost: () => 1,
  validate: (world, actorId, action) => {
    const carriable = getComponent(world, action.targetId, 'carriable')
    if (!carriable) return false
    // Already held by someone — can't pick it up from the world.
    if (getComponent(world, action.targetId, 'contained')) return false
    const containerId = getActorContainer(world, actorId)
    if (containerId === undefined) return false
    const container = getComponent(world, containerId, 'container')!
    // The transfer may merge into an existing stack, but worst case adds the
    // full effective size as a new entry. Validate against that ceiling.
    const incomingSize = effectiveCarriableSize(world, action.targetId)
    if (getContainerUsedCapacity(world, containerId) + incomingSize > container.capacity) return false
    return isAdjacent(world, actorId, action.targetId)
  },
  execute: (world, actorId, action) => {
    const containerId = getActorContainer(world, actorId)!
    transferToContainer(world, action.targetId, containerId)
  },
})
