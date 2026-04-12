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
  const index = new Map<string, EntityId>()
  for (const id of queryEntities(world, component, 'position')) {
    const pos = getComponent(world, id, 'position')!
    index.set(`${pos.x},${pos.y},${pos.z}`, id)
  }

  const faces: Face[] = []
  for (const [key, id] of index) {
    const [x, y, z] = key.split(',').map(Number)
    const right = index.get(`${x + 1},${y},${z}`)
    if (right !== undefined) faces.push({ entityA: id, entityB: right })
    const down = index.get(`${x},${y + 1},${z}`)
    if (down !== undefined) faces.push({ entityA: id, entityB: down })
  }

  return faces
}

/**
 * Build a deduplicated list of faces between adjacent entities in all 3 axes
 * (+x, +y, +z) that have the given component.
 */
export function buildFaces3d(world: World, component: ComponentName): Face[] {
  const index = new Map<string, EntityId>()
  for (const id of queryEntities(world, component, 'position')) {
    const pos = getComponent(world, id, 'position')!
    index.set(`${pos.x},${pos.y},${pos.z}`, id)
  }

  const faces: Face[] = []
  for (const [key, id] of index) {
    const [x, y, z] = key.split(',').map(Number)
    const right = index.get(`${x + 1},${y},${z}`)
    if (right !== undefined) faces.push({ entityA: id, entityB: right })
    const down = index.get(`${x},${y + 1},${z}`)
    if (down !== undefined) faces.push({ entityA: id, entityB: down })
    const below = index.get(`${x},${y},${z + 1}`)
    if (below !== undefined) faces.push({ entityA: id, entityB: below })
  }

  return faces
}
