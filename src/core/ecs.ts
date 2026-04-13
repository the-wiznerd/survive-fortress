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
  ap: number
  apPerTick: number
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
      instance: new Map(),
    },
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

/** Return all entity IDs at the given position. */
export function getEntitiesAt(world: World, x: number, y: number, z: number): EntityId[] {
  const result: EntityId[] = []
  for (const [id, pos] of world.components.position) {
    if (pos.x === x && pos.y === y && pos.z === z) {
      result.push(id)
    }
  }
  return result
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
