import {
  getComponent,
  getEntitiesAt,
  type World,
  type EntityId,
  type Action,
  type MaterialType,
  type MovementMode,
} from '@repo/state'
import { registerAction } from '~engine/actions/registry.js'

type MoveAction = Extract<Action, { type: 'move' }>

function getMaterialAt(world: World, x: number, y: number, z: number): MaterialType | undefined {
  for (const eid of getEntitiesAt(world, x, y, z)) {
    const m = getComponent(world, eid, 'material')
    if (m) return m.material
  }
  return undefined
}

function floorSupports(locomotion: string, floor: MaterialType | undefined): boolean {
  switch (locomotion) {
    case 'walk': return floor === 'solid'
    case 'swim': return true
    case 'sail': return floor === 'liquid'
    case 'fly': return true
    default: return false
  }
}

function destBlocks(locomotion: string, dest: MaterialType | undefined): boolean {
  switch (locomotion) {
    case 'walk': return dest !== undefined
    case 'swim': return dest !== 'liquid'
    case 'sail': return dest !== undefined
    case 'fly': return dest !== undefined
    default: return true
  }
}

/** Find the fastest mode (lowest pace) able to make this move, or null if none. */
function pickMode(world: World, actorId: EntityId, action: MoveAction): MovementMode | null {
  const movement = getComponent(world, actorId, 'movement')
  const pos = getComponent(world, actorId, 'position')
  if (!movement || !pos) return null

  const dx = pos.x + action.dx
  const dy = pos.y + action.dy
  const dest = getMaterialAt(world, dx, dy, pos.z)
  const floor = getMaterialAt(world, dx, dy, pos.z - 1)

  let best: MovementMode | null = null
  for (const m of movement.modes) {
    if (floorSupports(m.locomotion, floor) && !destBlocks(m.locomotion, dest)) {
      if (!best || m.pace < best.pace) best = m
    }
  }
  return best
}

registerAction<MoveAction>({
  type: 'move',
  cost: (world, actorId, action) => pickMode(world, actorId, action)?.pace ?? 1,
  validate: (world, actorId, action) => pickMode(world, actorId, action) !== null,
  execute: (world, actorId, action) => {
    const pos = getComponent(world, actorId, 'position')!
    pos.x = pos.x + action.dx
    pos.y = pos.y + action.dy
  },
})
