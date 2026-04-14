// ─── Entity ───
export type EntityId = number

// ─── Component Registry ───
// Add new components here. Each key is the component name, value is its data shape.
export interface ComponentTypes {
  position: Position
  health: Health
  hunger: Hunger
  speed: Speed
  playerControlled: PlayerControlled
  entityType: EntityType
  moisture: Moisture
  groundCover: GroundCover
  name: Name
  instance: Instance
}

export type ComponentName = keyof ComponentTypes

// ─── Component Definitions ───

export interface Position {
  x: number
  y: number
  z: number
}

export interface Health {
  current: number
  max: number
}

export interface Hunger {
  current: number
  max: number
  drainPerTick: number
}

export interface Speed {
  /** Move once every `pace` ticks. 1 = every tick, 3 = every 3rd tick. */
  pace: number
}

export interface PlayerControlled {
  /** Queued action for the current tick, if any. */
  pendingAction: Action | null
}

export interface EntityType {
  type: string
}

export interface Moisture {
  current: number
  capacity: number
  conductivity: number
}

export interface GroundCover {
  cover: string | null
}

export interface Name {
  name: string
}

export interface Instance {
  ref: import('./entityTypes/BaseEntityType.js').BaseEntityType
}

// ─── Actions ───

export type Action =
  | { type: 'move'; dx: number; dy: number }
  | { type: 'wait' }

// ─── World ───

export interface World {
  tick: number
  nextEntityId: EntityId
  /** Sparse component storage: componentName → (entityId → componentData) */
  components: {
    [K in ComponentName]: Map<EntityId, ComponentTypes[K]>
  }
  /** Spatial index: "x,y,z" → set of entity IDs at that position. */
  spatialIndex: Map<string, Set<EntityId>>
}

export function createWorld(): World {
  return {
    tick: 0,
    nextEntityId: 1,
    components: {
      position: new Map(),
      health: new Map(),
      hunger: new Map(),
      speed: new Map(),
      playerControlled: new Map(),
      entityType: new Map(),
      moisture: new Map(),
      groundCover: new Map(),
      name: new Map(),
      instance: new Map(),
    },
    spatialIndex: new Map(),
  }
}

// ─── Entity Operations ───

export function createEntity(world: World): EntityId {
  return world.nextEntityId++
}

export function addComponent<K extends ComponentName>(
  world: World,
  entity: EntityId,
  name: K,
  data: ComponentTypes[K],
): ComponentTypes[K] {
  world.components[name].set(entity, data)
  return data
}

export function getComponent<K extends ComponentName>(
  world: World,
  entity: EntityId,
  name: K,
): ComponentTypes[K] | undefined {
  return world.components[name].get(entity)
}

export function hasComponent(
  world: World,
  entity: EntityId,
  name: ComponentName,
): boolean {
  return world.components[name].has(entity)
}

export function removeEntity(world: World, entity: EntityId): void {
  // Clean up spatial index before removing components.
  const pos = world.components.position.get(entity)
  if (pos) removeFromSpatialIndex(world, entity, pos.x, pos.y, pos.z)
  for (const store of Object.values(world.components)) {
    (store as Map<EntityId, unknown>).delete(entity)
  }
}

// ─── Queries ───

/** Returns all entity IDs that have every one of the given components. */
export function queryEntities(
  world: World,
  ...required: ComponentName[]
): EntityId[] {
  if (required.length === 0) return []

  // Start with the smallest store for efficiency.
  let smallest: Map<EntityId, unknown> = world.components[required[0]]
  for (const name of required) {
    const store = world.components[name] as Map<EntityId, unknown>
    if (store.size < smallest.size) smallest = store
  }

  const result: EntityId[] = []
  for (const id of smallest.keys()) {
    if (required.every((name) => world.components[name].has(id))) {
      result.push(id)
    }
  }
  return result
}

/** Return all entity IDs at the given position (O(1) via spatial index). */
export function getEntitiesAt(world: World, x: number, y: number, z: number): EntityId[] {
  const set = world.spatialIndex.get(spatialKey(x, y, z))
  return set ? [...set] : []
}

/** Return all entity IDs in a column (all z levels at x, y). */
export function getEntitiesInColumn(world: World, x: number, y: number): EntityId[] {
  const result: EntityId[] = []
  for (const [id, pos] of world.components.position) {
    if (pos.x === x && pos.y === y) result.push(id)
  }
  return result
}

// ─── Spatial Index ───

function spatialKey(x: number, y: number, z: number): string {
  return `${x},${y},${z}`
}

/** Add an entity to the spatial index at the given position. */
export function addToSpatialIndex(world: World, entity: EntityId, x: number, y: number, z: number): void {
  const key = spatialKey(x, y, z)
  let set = world.spatialIndex.get(key)
  if (!set) { set = new Set(); world.spatialIndex.set(key, set) }
  set.add(entity)
}

/** Remove an entity from the spatial index at the given position. */
export function removeFromSpatialIndex(world: World, entity: EntityId, x: number, y: number, z: number): void {
  const key = spatialKey(x, y, z)
  const set = world.spatialIndex.get(key)
  if (set) {
    set.delete(entity)
    if (set.size === 0) world.spatialIndex.delete(key)
  }
}

/**
 * Place an entity at the given position, updating the spatial index.
 * For entities with a PositionTrait, prefer direct field mutation (setters maintain the index).
 * This function exists for raw entities (e.g. tests) that bypass traits.
 */
export function setPosition(world: World, entity: EntityId, x: number, y: number, z: number): void {
  const positions = world.components.position
  const old = positions.get(entity)

  if (old) {
    removeFromSpatialIndex(world, entity, old.x, old.y, old.z)
    old.x = x; old.y = y; old.z = z
  } else {
    positions.set(entity, { x, y, z })
  }

  addToSpatialIndex(world, entity, x, y, z)
}

/** Return orthogonal neighbor coordinates at the same z level. */
export function getNeighborCoords(x: number, y: number): [number, number][] {
  return [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ]
}
