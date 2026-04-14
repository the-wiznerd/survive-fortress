// ─── Entity Type Constructor ───

export type EntityTypeConstructor = new (world: World, id: EntityId) => BaseEntityType

// ─── Registry ───

const registry = new Map<string, EntityTypeConstructor>()

export function registerEntityType(type: string, ctor: EntityTypeConstructor): void {
  registry.set(type, ctor)
}

export function getEntityTypeConstructor(type: string): EntityTypeConstructor | undefined {
  return registry.get(type)
}

export function getRegisteredTypes(): string[] {
  return [...registry.keys()]
}

/** Create an entity, instantiate its class, initialize from state, and store the instance. */
export function spawnEntity(
  world: World,
  type: string,
  state: Record<string, unknown>,
): BaseEntityType {
  const ctor = registry.get(type)
  if (!ctor) throw new Error(`Unknown entity type "${type}"`)
  const id = createEntity(world)
  const instance = new ctor(world, id)
  addComponent(world, id, 'entityType', { type })
  instance.init(state)
  addComponent(world, id, 'instance', { ref: instance })
  return instance
}
