import type { EntityId, ComponentName, World } from '~state/ecs.js'
import { queryEntities, getComponent, hasComponent, getEntitiesAt } from '~state/ecs.js'

export interface Face {
  entityA: EntityId
  entityB: EntityId
}

/**
 * Build a deduplicated list of faces between orthogonally adjacent entities
 * (same z-level) that have the given component.
 *
 * By only checking +x and +y neighbors, each pair is found exactly once.
 */
export function buildFaces2d(world: World, component: ComponentName): Face[] {
  const faces: Face[] = []
  for (const id of queryEntities(world, component, 'position')) {
    const pos = getComponent(world, id, 'position')!
    for (const neighborId of getEntitiesAt(world, pos.x + 1, pos.y, pos.z)) {
      if (hasComponent(world, neighborId, component)) faces.push({ entityA: id, entityB: neighborId })
    }
    for (const neighborId of getEntitiesAt(world, pos.x, pos.y + 1, pos.z)) {
      if (hasComponent(world, neighborId, component)) faces.push({ entityA: id, entityB: neighborId })
    }
  }
  return faces
}

/**
 * Build a deduplicated list of faces between adjacent entities in all 3 axes
 * (+x, +y, +z) that have the given component.
 */
export function buildFaces3d(world: World, component: ComponentName): Face[] {
  const faces: Face[] = []
  for (const id of queryEntities(world, component, 'position')) {
    const pos = getComponent(world, id, 'position')!
    for (const neighborId of getEntitiesAt(world, pos.x + 1, pos.y, pos.z)) {
      if (hasComponent(world, neighborId, component)) faces.push({ entityA: id, entityB: neighborId })
    }
    for (const neighborId of getEntitiesAt(world, pos.x, pos.y + 1, pos.z)) {
      if (hasComponent(world, neighborId, component)) faces.push({ entityA: id, entityB: neighborId })
    }
    for (const neighborId of getEntitiesAt(world, pos.x, pos.y, pos.z + 1)) {
      if (hasComponent(world, neighborId, component)) faces.push({ entityA: id, entityB: neighborId })
    }
  }
  return faces
}
