import {
  type EntityId,
  type World,
  type ComponentName,
  type ComponentTypes,
  createEntity,
  addComponent,
  getComponent,
} from './ecs.js';

// ─── Entity Type Definition ───

export interface EntityTypeDef {
  type: string;

  /**
   * Export: given an entity in the world, produce the type-specific save state.
   * Position is handled by the framework — just return type-specific data.
   */
  export(world: World, id: EntityId): Record<string, unknown>;

  /**
   * Import: given save data, spawn the entity in the world and return its ID.
   * Position is already extracted — use the provided x, y, elevation.
   */
  import(world: World, x: number, y: number, elevation: number, state: Record<string, unknown>): EntityId;

  /**
   * Optional per-entity tick logic. Called once per tick for each entity of this type.
   * Use for entity-specific behavior (FSMs, AI, etc.).
   */
  tick?(world: World, id: EntityId): void;
}

// ─── Registry ───

const registry = new Map<string, EntityTypeDef>();

export function registerEntityType(def: EntityTypeDef): void {
  registry.set(def.type, def);
}

export function getEntityTypeDef(type: string): EntityTypeDef | undefined {
  return registry.get(type);
}

export function getRegisteredTypes(): string[] {
  return [...registry.keys()];
}

// ─── Helpers for common patterns ───

/**
 * Helper to export a set of components by name.
 * Returns an object with each component's data keyed by name.
 */
export function exportComponents(
  world: World,
  id: EntityId,
  ...names: ComponentName[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const name of names) {
    const data = getComponent(world, id, name);
    if (data !== undefined) {
      result[name] = { ...data };
    }
  }
  return result;
}

/**
 * Helper to import components from saved state onto an entity.
 */
export function importComponents(
  world: World,
  id: EntityId,
  state: Record<string, unknown>,
  ...names: ComponentName[]
): void {
  for (const name of names) {
    if (state[name] !== undefined) {
      addComponent(world, id, name, state[name] as ComponentTypes[typeof name]);
    }
  }
}
