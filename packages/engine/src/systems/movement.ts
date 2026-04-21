import { queryEntities, getComponent, getEntitiesAt, type World, type Action, type MaterialType } from '@repo/state'

/** Get the material type at a position (undefined = air/empty). */
function getMaterialAt(world: World, x: number, y: number, z: number): MaterialType | undefined {
  for (const eid of getEntitiesAt(world, x, y, z)) {
    const m = getComponent(world, eid, 'material')
    if (m) return m.material
  }
  return undefined
}

/** Does the floor material (dz - 1) support this locomotion? */
function floorSupports(locomotion: string, floor: MaterialType | undefined): boolean {
  switch (locomotion) {
    case 'walk': return floor === 'solid'
    case 'swim': return true          // floor irrelevant — swimmer is immersed
    case 'sail': return floor === 'liquid'
    case 'fly': return true           // floor irrelevant — flyer is airborne
    default: return false
  }
}

/** Does the destination material (dz) block this locomotion? */
function destBlocks(locomotion: string, dest: MaterialType | undefined): boolean {
  switch (locomotion) {
    case 'walk': return dest !== undefined   // any material blocks walking
    case 'swim': return dest !== 'liquid'    // need liquid to swim into
    case 'sail': return dest !== undefined   // any material blocks sailing
    case 'fly': return dest !== undefined    // any material blocks flying
    default: return true
  }
}

/** Check whether a locomotion mode can move into dest with the given floor. */
function canMove(locomotion: string, dest: MaterialType | undefined, floor: MaterialType | undefined): boolean {
  return floorSupports(locomotion, floor) && !destBlocks(locomotion, dest)
}

export function movementSystem(world: World) {
  for (const id of queryEntities(world, 'movement', 'position')) {
    const movement = getComponent(world, id, 'movement')!

    // Tick all mode counters.
    for (const mode of movement.modes) {
      if (mode.tickCount < mode.pace) mode.tickCount++
    }

    // Only consume the action if at least one mode is ready.
    const anyReady = movement.modes.some(m => m.tickCount >= m.pace)
    if (!anyReady) continue

    // Pull next action from the plan queue (player-controlled entities).
    let action: Action | null = null
    const pc = getComponent(world, id, 'playerControlled')
    if (pc) {
      if (pc.planIndex < pc.plan.length) {
        action = pc.plan[pc.planIndex]!
      } else {
        continue // plan exhausted — idle
      }
    }

    if (action?.type === 'move') {
      const pos = getComponent(world, id, 'position')!
      const destX = pos.x + action.dx
      const destY = pos.y + action.dy
      const destZ = pos.z

      const dest = getMaterialAt(world, destX, destY, destZ)
      const floor = getMaterialAt(world, destX, destY, destZ - 1)

      // Find first ready mode that permits the move.
      const mode = movement.modes.find(m => m.tickCount >= m.pace && canMove(m.locomotion, dest, floor))
      if (!mode) {
        // Move blocked — terminate plan.
        if (pc) pc.planIndex = pc.plan.length
        continue
      }

      pos.x = destX
      pos.y = destY
      mode.tickCount = 0
      if (pc) pc.planIndex++
    } else if (action?.type === 'wait') {
      if (pc) pc.planIndex++
    }
  }
}
