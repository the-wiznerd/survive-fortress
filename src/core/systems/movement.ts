export function movementSystem(world: World) {
  const MOVE_COST = 10

  for (const id of queryEntities(world, 'speed', 'position')) {
    const speed = getComponent(world, id, 'speed')!
    speed.ap += speed.apPerTick

    let action: Action | null = null

    const pc = getComponent(world, id, 'playerControlled')
    if (pc) {
      action = pc.pendingAction
      pc.pendingAction = null
    }

    if (action?.type === 'move' && speed.ap >= MOVE_COST) {
      const pos = getComponent(world, id, 'position')!
      pos.x += action.dx
      pos.y += action.dy
      speed.ap -= MOVE_COST
    }
  }
}
