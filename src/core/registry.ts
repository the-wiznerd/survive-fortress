// ─── Entity Type Definition ───

export interface EntityTypeDef {
  type: string
  sortOffset: number
  export(world: World, id: EntityId): Record<string, unknown>
  import(world: World, id: EntityId, state: Record<string, unknown>): void
  tick?(world: World, id: EntityId): void
}

// ─── Registry ───

const registry = new Map<string, EntityTypeDef>()

export function registerEntityType(def: EntityTypeDef): void {
  registry.set(def.type, def)
}

export function getEntityTypeDef(type: string): EntityTypeDef | undefined {
  return registry.get(type)
}

export function getRegisteredTypes(): string[] {
  return [...registry.keys()]
}
