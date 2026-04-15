import { queryEntities, getComponent, type World, type Action } from '@repo/state'

export function movementSystem(world: World) {
  for (const id of queryEntities(world, 'movement', 'position')) {
    const movement = getComponent(world, id, 'movement')! as MovementTrait
    movement.timer.tick()

    if (!movement.timer.ready) continue

    let action: Action | null = null

    const pc = getComponent(world, id, 'playerControlled')
    if (pc) {
      action = pc.pendingAction
      pc.pendingAction = null
    }

    if (action?.type === 'move') {
      const pos = getComponent(world, id, 'position')!
      pos.x += action.dx
      pos.y += action.dy
      movement.timer.reset()
    }
  }
}
