import {
  getComponent,
  addComponent,
  hasComponent,
  removeFromSpatialIndex,
  addToSpatialIndex,
  removeEntity,
  type World,
  type EntityId,
} from '@repo/state'

/**
 * All mutations to containment relationships flow through these helpers so the
 * spatial index, Container.contents arrays, and Contained back-pointers stay
 * in sync.
 *
 * Carried entities are recorded in the spatial index at their carrier's
 * coordinates — a bear at the carrier's tile can sense the meat inside the bag,
 * and any future "stuff at this tile" query returns held items naturally.
 * Renderers and movement-blocker checks filter on the `contained` component.
 */

/** Returns the parent entity id, or undefined if the entity is not contained. */
export function getContainerOf(world: World, entityId: EntityId): EntityId | undefined {
  return getComponent(world, entityId, 'contained')?.parentId
}

/** Returns the live contents of an entity's container, or [] if it has none. */
export function getContainerContents(world: World, entityId: EntityId): EntityId[] {
  return getComponent(world, entityId, 'container')?.contents ?? []
}

/**
 * Returns the id of the container an actor should place picked-up items into.
 * Prefers a Container trait on the actor itself, then searches equipped items
 * for one that has a Container (e.g. a bag on the back). Returns undefined if
 * no storage is reachable.
 */
export function getActorContainer(world: World, actorId: EntityId): EntityId | undefined {
  if (getComponent(world, actorId, 'container')) return actorId
  const equipment = getComponent(world, actorId, 'equipment')
  if (!equipment) return undefined
  for (const id of Object.values(equipment.slots)) {
    if (id !== null && getComponent(world, id, 'container')) return id
  }
  return undefined
}

/**
 * Whether `actorId` (transitively) holds `itemId` — i.e. there exists a chain of
 * contained back-pointers from the item ending at the actor. Handles both
 * container and equipment relationships.
 */
export function isHeldByActor(world: World, itemId: EntityId, actorId: EntityId): boolean {
  let cur = getContainerOf(world, itemId)
  const seen = new Set<EntityId>()
  while (cur !== undefined) {
    if (cur === actorId) return true
    if (seen.has(cur)) return false // defensive cycle guard
    seen.add(cur)
    cur = getContainerOf(world, cur)
  }
  return false
}

/**
 * Move an entity into a container. Removes it from any current parent or
 * world position. The carried entity's spatial index entry follows the carrier.
 *
 * Returns true on success, false if the destination cannot accept the item
 * (missing Container, capacity exceeded).
 */
export function transferToContainer(
  world: World,
  itemId: EntityId,
  containerId: EntityId,
): boolean {
  const container = getComponent(world, containerId, 'container')
  if (!container) return false

  const carriable = getComponent(world, itemId, 'carriable')
  const size = carriable?.size ?? 1

  // Capacity check accounts for currently-held items only — re-parenting to the
  // same container is a no-op below.
  const currentParent = getContainerOf(world, itemId)
  if (currentParent !== containerId) {
    let used = 0
    for (const id of container.contents) {
      const c = getComponent(world, id, 'carriable')
      if (c) used += c.size
    }
    if (used + size > container.capacity) return false
  } else {
    return true // Already here.
  }

  // Capture the item's current effective coordinates so any descendants can be
  // shifted in the spatial index alongside it.
  const itemPosBefore = getComponent(world, itemId, 'position')
  const ox = itemPosBefore?.x ?? 0
  const oy = itemPosBefore?.y ?? 0
  const oz = itemPosBefore?.z ?? 0

  // Detach from the previous holder, if any.
  if (currentParent !== undefined) {
    detachFromParent(world, itemId, currentParent)
  } else {
    // Was free in the world — remove from its current spatial position.
    removeFromSpatialIndex(world, itemId, ox, oy, oz)
  }

  // Attach to the new container.
  if (!hasComponent(world, itemId, 'contained')) {
    addComponent(world, itemId, 'contained', { parentId: containerId })
  } else {
    getComponent(world, itemId, 'contained')!.parentId = containerId
  }
  container.contents.push(itemId)

  // Place the item in the spatial index at the carrier's coordinates, then
  // shift any of its own descendants to match.
  const carrierPos = getComponent(world, containerId, 'position')
  const nx = carrierPos?.x ?? 0
  const ny = carrierPos?.y ?? 0
  const nz = carrierPos?.z ?? 0
  addToSpatialIndex(world, itemId, nx, ny, nz)
  moveContainedChildren(world, itemId, ox, oy, oz, nx, ny, nz)

  return true
}

/**
 * Remove an entity from its container and place it in the world at the given
 * coordinates. Returns true on success, false if the entity isn't contained.
 */
export function removeFromContainer(
  world: World,
  itemId: EntityId,
  x: number,
  y: number,
  z: number,
): boolean {
  const parentId = getContainerOf(world, itemId)
  if (parentId === undefined) return false

  // Capture old effective coords before detaching (these are the parent's coords,
  // which is also where any descendants live in the spatial index).
  const itemPosBefore = getComponent(world, itemId, 'position')
  const ox = itemPosBefore?.x ?? 0
  const oy = itemPosBefore?.y ?? 0
  const oz = itemPosBefore?.z ?? 0

  detachFromParent(world, itemId, parentId)

  // Update the item's own position (PositionTrait setter maintains the spatial index).
  if (itemPosBefore) {
    itemPosBefore.x = x
    itemPosBefore.y = y
    itemPosBefore.z = z
  } else {
    addToSpatialIndex(world, itemId, x, y, z)
  }
  moveContainedChildren(world, itemId, ox, oy, oz, x, y, z)
  return true
}

/**
 * Update spatial index entries for every entity contained by `parentId` so they
 * track the parent moving from `(ox, oy, oz)` to `(nx, ny, nz)`. Called from
 * the parent's PositionTrait setter; not normally invoked directly.
 */
export function moveContainedChildren(
  world: World,
  parentId: EntityId,
  ox: number, oy: number, oz: number,
  nx: number, ny: number, nz: number,
): void {
  if (ox === nx && oy === ny && oz === nz) return
  const children: EntityId[] = []
  const container = getComponent(world, parentId, 'container')
  if (container) children.push(...container.contents)
  const equipment = getComponent(world, parentId, 'equipment')
  if (equipment) {
    for (const id of Object.values(equipment.slots)) {
      if (id !== null) children.push(id)
    }
  }
  for (const childId of children) {
    removeFromSpatialIndex(world, childId, ox, oy, oz)
    addToSpatialIndex(world, childId, nx, ny, nz)
    // Recurse — a container holding a container holds things too.
    moveContainedChildren(world, childId, ox, oy, oz, nx, ny, nz)
  }
}

// ─── Internal ───

function detachFromParent(world: World, itemId: EntityId, parentId: EntityId): void {
  const parentContainer = getComponent(world, parentId, 'container')
  if (parentContainer) {
    const idx = parentContainer.contents.indexOf(itemId)
    if (idx !== -1) parentContainer.contents.splice(idx, 1)
  }
  const parentEquipment = getComponent(world, parentId, 'equipment')
  if (parentEquipment) {
    for (const [slot, id] of Object.entries(parentEquipment.slots)) {
      if (id === itemId) parentEquipment.slots[slot] = null
    }
  }
  // Remove from spatial index at carrier's current location.
  const carrierPos = getComponent(world, parentId, 'position')
  if (carrierPos) removeFromSpatialIndex(world, itemId, carrierPos.x, carrierPos.y, carrierPos.z)

  // Clear the back-pointer.
  world.components.contained.delete(itemId)
}

/**
 * Fully destroy an entity, handling containment correctly:
 *   - recursively destroys any entities it carries (so eating a bag eats its contents)
 *   - detaches from its parent container, if any
 *   - removes from spatial index and deletes all components
 */
export function destroyEntity(world: World, entityId: EntityId): void {
  const container = getComponent(world, entityId, 'container')
  if (container) {
    // Copy because destroyEntity mutates contents.
    for (const childId of [...container.contents]) {
      destroyEntity(world, childId)
    }
  }
  const equipment = getComponent(world, entityId, 'equipment')
  if (equipment) {
    for (const id of Object.values(equipment.slots)) {
      if (id !== null) destroyEntity(world, id)
    }
  }
  const parentId = getContainerOf(world, entityId)
  if (parentId !== undefined) {
    detachFromParent(world, entityId, parentId)
  }
  removeEntity(world, entityId)
}

/**
 * Equip a Wearable item into a specific named slot of a wearer's Equipment.
 * Returns true on success, false if the wearer has no such slot, it's occupied,
 * or the item isn't a Wearable compatible with the slot.
 */
export function equipItem(
  world: World,
  itemId: EntityId,
  wearerId: EntityId,
  slot: string,
): boolean {
  const equipment = getComponent(world, wearerId, 'equipment')
  if (!equipment) return false
  if (!(slot in equipment.slots)) return false
  if (equipment.slots[slot] !== null) return false
  const wearable = getComponent(world, itemId, 'wearable')
  if (!wearable || wearable.slot !== slot) return false

  // Capture the item's current effective coordinates so descendants follow.
  const itemPosBefore = getComponent(world, itemId, 'position')
  const ox = itemPosBefore?.x ?? 0
  const oy = itemPosBefore?.y ?? 0
  const oz = itemPosBefore?.z ?? 0

  const prevParent = getContainerOf(world, itemId)
  if (prevParent !== undefined) {
    detachFromParent(world, itemId, prevParent)
  } else {
    removeFromSpatialIndex(world, itemId, ox, oy, oz)
  }

  if (!hasComponent(world, itemId, 'contained')) {
    addComponent(world, itemId, 'contained', { parentId: wearerId })
  } else {
    getComponent(world, itemId, 'contained')!.parentId = wearerId
  }
  equipment.slots[slot] = itemId

  const wearerPos = getComponent(world, wearerId, 'position')
  const nx = wearerPos?.x ?? 0
  const ny = wearerPos?.y ?? 0
  const nz = wearerPos?.z ?? 0
  addToSpatialIndex(world, itemId, nx, ny, nz)
  moveContainedChildren(world, itemId, ox, oy, oz, nx, ny, nz)

  return true
}

/**
 * Remove an equipped item from its slot and place it in the world at (x, y, z).
 * Thin wrapper over `removeFromContainer`, which already handles both container
 * and equipment detachment. Provided for clarity at call sites.
 */
export function unequipItem(
  world: World,
  itemId: EntityId,
  x: number,
  y: number,
  z: number,
): boolean {
  return removeFromContainer(world, itemId, x, y, z)
}
