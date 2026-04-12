---
applyTo: "packages/core/src/entityTypes/**"
description: "Entity type definition pattern — how to create new entity types using composition, the EntityTypeDef interface, and self-registration. Use when creating, modifying, or reviewing entity type classes."
---

# Entity Type Definitions

## Architecture: Traits + Systems + Entity Types

The game uses a **three-layer architecture**:

1. **Systems** (`systems/`) — Global, ordered, run first. Resolve cross-entity interactions (moisture equalization, combat resolution, fluid flow). Entities are passive subjects. Systems operate on raw ECS component data.
2. **Traits** (`traits/`) — Data + defaults + serialization + typed API + optional behavior methods. Each trait wraps a single ECS component, providing defaults, typed access, and automatic save/load. Traits hold a back-reference to their world and entity ID.
3. **Entity Types** (`entityTypes/`) — Compose traits. Own the tick. Run FSMs. Decide state transitions. Extend `BaseEntityType`.

### The two phases of a tick

```
Phase 1: Systems (the world acts on you)
  - moisture equalization
  - hunger drain
  - movement resolution
  → You don't get a say. These resolve world state.

Phase 2: Entity type ticks (you act in the world)
  - Dirt checks moisture → become grass?
  - AI decides next action
  - FSM state transitions
  → Entity type orchestrates its traits based on resolved state.
```

### What an entity type class does

- **`createTraits()`** — Declares which traits this entity has, with any default overrides.
- **`tick()`** (optional) — Per-entity behavior each game tick. Reads resolved state, orchestrates traits, handles state transitions.
- **`import()`/`export()`** — Inherited from `BaseEntityType`. Automatically handled via traits.

### What an entity type class does NOT do

- **Does not manually call `addComponent()`.** Traits handle that.
- **Does not manually implement `import()`/`export()`.** `BaseEntityType` iterates traits automatically.
- **Does not extend other entity types.** No `extends Animal`. Shared behavior comes from shared traits and/or systems.

## Traits

A trait is a class that extends `Trait<K>` where `K` is a `ComponentName`. Each trait:

- Wraps a single ECS component
- Declares its `defaults()`
- Gets auto-serialization: only saves when component data differs from defaults
- Has typed `this.data` access to its component
- Has `this.position` for spatial access
- Has `this.world` and `this.entityId` for ECS queries

### Trait with fixed defaults

```ts
export class HealthTrait extends Trait<'health'> {
  readonly component = 'health' as const

  defaults(): Health {
    return { current: 100, max: 100 }
  }
}
```

### Trait with configurable defaults

When different entity types need different defaults for the same trait:

```ts
export class MoistureTrait extends Trait<'moisture'> {
  readonly component = 'moisture' as const

  constructor(world: World, entityId: EntityId, private overrides: Partial<Moisture> = {}) {
    super(world, entityId)
  }

  defaults(): Moisture {
    return { current: 0, capacity: 100, rate: 1, ...this.overrides }
  }
}
```

### Creating a new trait

1. Create `packages/core/src/traits/<Name>Trait.ts` (capitalized to match the class name).
2. Extend `Trait<'componentName'>`.
3. Set `readonly component = 'componentName' as const`.
4. Implement `defaults()` returning the component's data shape.
5. Add constructor overrides if different entity types need different defaults.
6. Add the trait class to `coreImports` in `vitest.config.ts`.
7. **Do not add any import statements** — all `@sf/core` values and types are globally available.

## Systems

Systems are global functions that process all entities with certain components. They run in Phase 1, before entity type ticks. They operate on raw ECS component data, not traits.

### When to use a system vs. a trait tick

- **System**: Cross-entity interactions that need deduplication or global resolution (moisture equalization, combat, fluid flow). "The world acts on you."
- **Entity type tick**: Per-entity decisions based on resolved state (dirt→grass, AI behavior, FSM transitions). "You act in the world."

### Creating a new system

1. Create `packages/core/src/systems/<name>.ts` (camelCase — systems export functions, not classes).
2. Export a `const mySystem: System = (world) => { ... }`.
3. Add it to `defaultSystems` in `tick.ts` (order matters — systems before `entityTypeTickSystem`).
4. Add the system to `coreImports` in `vitest.config.ts`.
5. **Do not add any import statements.**

## Entity Types

### Simple terrain (no traits)

```ts
export class Grass extends BaseEntityType {
  type = 'grass'

  protected createTraits() {
    return []
  }
}

registerEntityType(new Grass())
```

### Entity with traits

```ts
export class Dirt extends BaseEntityType {
  type = 'dirt'

  protected createTraits(world: World, id: EntityId) {
    return [
      new MoistureTrait(world, id, { current: 0, capacity: 50, rate: 1 }),
    ]
  }

  tick(world: World, id: EntityId): void {
    const moisture = getComponent(world, id, 'moisture')
    if (moisture && moisture.current >= GRASS_THRESHOLD) {
      getComponent(world, id, 'entityType')!.type = 'grass'
      world.components.moisture.delete(id)
      this.destroyTraits(id)
    }
  }
}

registerEntityType(new Dirt())
```

### Complex entity with many traits

```ts
export class Player extends BaseEntityType {
  type = 'player'

  protected createTraits(world: World, id: EntityId) {
    return [
      new HealthTrait(world, id),
      new HungerTrait(world, id),
      new SpeedTrait(world, id),
      new PlayerControlledTrait(world, id),
    ]
  }
}

registerEntityType(new Player())
```

### Creating a new entity type

1. Create `packages/core/src/entityTypes/<Name>.ts` (capitalized to match the class name).
2. Extend `BaseEntityType`.
3. Set `type = '<name>'`.
4. Implement `createTraits()` — return an array of trait instances.
5. Optionally add `tick()` for per-entity behavior (Phase 2).
6. Call `registerEntityType(new ClassName())` at the bottom of the file.
7. Add a side-effect import in consumers (`main.ts`, test files) that need this type.
8. **Do not add any import statements** — all `@sf/core` values and types are globally available.

## Self-Registration

Each entity type file calls `registerEntityType(new ClassName())` at **module scope** (bottom of file). Consumers add a **side-effect import** to trigger registration:

```ts
import '@sf/core/entityTypes/Dirt.js'
```

## Accessing traits from entity type ticks

Use `this.trait(id, 'componentName')` to get a trait instance, or read raw ECS data via `getComponent()`:

```ts
tick(world: World, id: EntityId): void {
  // Raw ECS access (simple reads)
  const moisture = getComponent(world, id, 'moisture')

  // Trait instance access (when you need trait methods)
  const moistureTrait = this.trait(id, 'moisture')
}
```

## Serialization

`BaseEntityType` handles import/export automatically:

- **Import**: For each trait, creates the instance, writes defaults to ECS, then overlays any saved state via shallow merge (`{ ...defaults, ...saved }`).
- **Export**: For each trait, compares current component data to defaults. Only saves components that have changed. Components at defaults produce no save data.

This means:
- Forward-compatible: new fields in defaults get picked up on load.
- Minimal saves: transient/default components (like `playerControlled`) never appear in save files.
- Create a **system** in `tick.ts` that queries for that component and processes all matching entities.

This keeps entity types as thin factories and avoids the diamond problem entirely.
