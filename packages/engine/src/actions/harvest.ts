import { getComponent, type Action, type World, type EntityId } from '@repo/state'
import { registerAction } from '~engine/actions/registry.js'
import type { HarvestableTrait } from '~engine/traits/HarvestableTrait.js'

type HarvestAction = Extract<Action, { type: 'harvest' }>

/** Manhattan distance ≤ 1 on the same z-plane. */
function isAdjacent(world: World, actorId: EntityId, targetId: EntityId): boolean {
  const a = getComponent(world, actorId, 'position')
  const b = getComponent(world, targetId, 'position')
  if (!a || !b) return false
  return a.z === b.z && Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1
}

registerAction<HarvestAction>({
  type: 'harvest',
  cost: (world, _actorId, action) => {
    const target = getComponent(world, action.targetId, 'harvestable')
    return target?.cost ?? 1
  },
  validate: (world, actorId, action) => {
    const target = getComponent(world, action.targetId, 'harvestable')
    if (!target || target.amount <= 0) return false
    return isAdjacent(world, actorId, action.targetId)
  },
  execute: (world, actorId, action) => {
    const target = getComponent(world, action.targetId, 'harvestable') as HarvestableTrait
    target.onHarvest(actorId)
  },
})
