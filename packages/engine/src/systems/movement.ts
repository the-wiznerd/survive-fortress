export function movementSystem(world: World) {
  for (const id of queryEntities(world, 'speed', 'position')) {
    const speed = getComponent(world, id, 'speed')!
    if (world.tick % speed.pace !== 0) continue

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
    }
  }
}
