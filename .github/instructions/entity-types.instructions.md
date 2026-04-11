---
applyTo: "packages/core/src/entityTypes/**"
description: "Entity type definition pattern — how to create new entity types using composition, the EntityTypeDef interface, and self-registration. Use when creating, modifying, or reviewing entity type classes."
---

# Entity Type Definitions

## Architecture: Composition Over Inheritance

Entity types use **flat composition via ECS components**, not class inheritance. Each entity type is a class that implements `EntityTypeDef` — but the class is just a **factory and serializer**, not a container for behavior or state.

### What the class does

- **`import()`** — Factory: creates an entity, attaches the right components, returns the ID.
- **`export()`** — Serializer: reads components and returns a plain state object for saving.
- **`tick()`** (optional) — Per-entity behavior each game tick (FSMs, AI, growth, decay).

### What the class does NOT do

- **Does not hold entity state.** All state lives in ECS components. The class is stateless.
- **Does not extend a base class.** No `extends Animal`, no `extends Terrain`. A "grass that grows" just adds a `tick()` method — it doesn't inherit from `Plant`.
- **Does not define shared behavior via inheritance.** If multiple entity types share logic (e.g. "things that burn"), that's a **system** that queries for the relevant components, not a base class.

### Why no inheritance

Inheritance creates rigid hierarchies. "Is a WaterPlant a Plant or a Water?" is the wrong question. Instead:
- A water plant has a `terrain` component (it's walkable-on), a `growth` component (it grows), and a `flammable` component (it burns).
- Systems process entities by component, not by type. The burn system doesn't care if something is a plant — it cares if it has `flammable`.

### Composition patterns

**Simple terrain** — just position + terrain + entityType:
```ts
export class Dirt implements EntityTypeDef {
  type = 'dirt'

  import(world: World, x: number, y: number, elevation: number, _state: Record<string, unknown>): EntityId {
    const id = createEntity(world)
    addComponent(world, id, 'entityType', { type: 'dirt' })
    addComponent(world, id, 'position', { x, y, elevation })
    addComponent(world, id, 'terrain', { type: 'dirt' })
    return id
  }

  export(_world: World, _id: EntityId): Record<string, unknown> {
    return {}
  }
}

registerEntityType(new Dirt())
```

**Complex entity with saved state** — uses helper functions for round-tripping components:
```ts
export class Player implements EntityTypeDef {
  type = 'player'

  import(world: World, x: number, y: number, elevation: number, state: Record<string, unknown>): EntityId {
    const id = createEntity(world)
    addComponent(world, id, 'entityType', { type: 'player' })
    addComponent(world, id, 'position', { x, y, elevation })
    addComponent(world, id, 'health', { current: 100, max: 100 })
    addComponent(world, id, 'hunger', { current: 100, max: 100, drainPerTick: 1 })
    addComponent(world, id, 'speed', { ap: 0, apPerTick: 10 })
    addComponent(world, id, 'playerControlled', { pendingAction: null })
    importComponents(world, id, state, 'health', 'hunger', 'speed')
    return id
  }

  export(world: World, id: EntityId): Record<string, unknown> {
    return exportComponents(world, id, 'health', 'hunger', 'speed')
  }
}

registerEntityType(new Player())
```

## Self-Registration

Each entity type file calls `registerEntityType(new ClassName())` at **module scope** (bottom of file). This means:
- No barrel file or manual registration list.
- Consumers just add a **side-effect import** to trigger registration: `import '../../core/src/entityTypes/mytype.js'`
- The test file and ui `main.ts` each import the entity types they need this way.

## Creating a New Entity Type

1. Create `packages/core/src/entityTypes/<name>.ts`.
2. Define a class implementing `EntityTypeDef`.
3. In `import()`, call `createEntity()` then `addComponent()` for each component the entity needs. Always include `entityType` and `position`.
4. In `export()`, return the state that needs to be saved. Use `exportComponents()` helper for component round-tripping. Return `{}` if there's no type-specific state.
5. Optionally add `tick()` for per-entity behavior.
6. Call `registerEntityType(new ClassName())` at the bottom of the file.
7. Add a side-effect import in consumers (`main.ts`, test files) that need this type.
8. **Do not add any import statements** — all `@sf/core` values and types are globally available.

## Cross-Cutting Behavior: Use Systems, Not Base Classes

If you need behavior shared across entity types:
- Add a new **component** to `ecs.ts` (e.g. `flammable`, `growable`).
- Add the component in `import()` of entity types that need it.
- Create a **system** in `tick.ts` that queries for that component and processes all matching entities.

This keeps entity types as thin factories and avoids the diamond problem entirely.
