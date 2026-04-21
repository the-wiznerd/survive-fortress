import { queryEntities, getComponent, type World } from '@repo/state'
import type { HarvestableTrait } from '~engine/traits/HarvestableTrait.js'

/** Manhattan distance adjacency check (same z, distance ≤ 1). */
function isAdjacent(ax: number, ay: number, az: number, bx: number, by: number, bz: number): boolean {
  return az === bz && Math.abs(ax - bx) + Math.abs(ay - by) <= 1
}

export function harvestSystem(world: World) {
  for (const harvesterId of queryEntities(world, 'playerControlled', 'position')) {
    const pc = getComponent(world, harvesterId, 'playerControlled')!
    const action = pc.plan[pc.planIndex]
    if (!action || action.type !== 'harvest') continue

    const harvesterPos = getComponent(world, harvesterId, 'position')!
    const target = getComponent(world, action.targetId, 'harvestable') as HarvestableTrait | undefined
    if (!target || target.amount <= 0) continue

    const targetPos = getComponent(world, action.targetId, 'position')
    if (!targetPos) continue

    if (!isAdjacent(harvesterPos.x, harvesterPos.y, harvesterPos.z, targetPos.x, targetPos.y, targetPos.z)) continue

    target.onHarvest(harvesterId)
  }
}
