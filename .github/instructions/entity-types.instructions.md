---
applyTo: "packages/engine/src/entityTypes/**"
description: "Entity type and trait patterns — how to create entity types, traits, and systems. Per-entity instances, trait-is-component architecture, and registration."
---

# Entity Types, Traits & Systems

## Architecture Overview

The game uses a **three-layer architecture**:

1. **Systems** (`systems/`) — Global, ordered, run first. Resolve cross-entity interactions (moisture equalization, combat resolution, fluid flow). Entities are passive subjects. Systems can use raw `getComponent()` for bulk iteration.
2. **Traits** (`traits/`) — Each trait *is* its component. The trait instance is stored directly in the ECS Map, so `getComponent()` returns the trait itself. Traits provide defaults, typed field access, and automatic save/load.
3. **Entity Types** (`entityTypes/`) — Per-entity class instances that compose traits as typed members. Own the tick. Run FSMs. Decide state transitions. Extend `BaseEntityType`.

### Design philosophy

- **Traits are the public API.** Entities and systems interact through trait fields and methods (`this.moisture.current`, `this.position.x`) without needing to know about the ECS storage behind them.
- **The ECS Maps are the query/storage engine.** You ask "give me all entities with moisture" and get back objects you interact with through their API.
- **The trait IS the component.** `getComponent(world, id, 'moisture')` returns the `MoistureTrait` instance, which structurally satisfies the `Moisture` interface. No indirection.

### The two phases of a tick

```
Phase 1: Systems (the world acts on you)
  - moisture equalization
  - hunger drain
  - movement resolution
  → You don't get a say. These resolve world state.

Phase 2: Entity type ticks (you act in the world)
  - Dirt checks moisture → set ground cover?
  - AI decides next action
  - FSM state transitions
  → Entity type orchestrates its traits based on resolved state.
```

## Traits

A trait is a class that extends `Trait<K>` where `K` is a `ComponentName`. Each trait:

- Wraps a single ECS component
- Declares data fields with `declare` (assigned at runtime by `init()`)
- Declares its `defaults()`
- Gets auto-serialization: only saves when data differs from defaults
- Has `this.world` and `this.entityId` for ECS queries

### Trait with fixed defaults

```ts
export class HealthTrait extends Trait<'health'> {
  readonly component = 'health' as const
  declare current: number
  declare max: number

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
  declare current: number
  declare capacity: number
  declare rate: number

  constructor(world: World, entityId: EntityId, private overrides: Partial<Moisture> = {}) {
    super(world, entityId)
  }

  defaults(): Moisture {
    return { current: 0, capacity: 100, rate: 10, ...this.overrides }
  }
}
```

### How traits work internally

- `init()` calls `Object.assign(this, defaults, saved)` then stores `this` in the ECS Map via `addComponent()`.
- The trait instance *is* the Map entry. Mutations to `trait.current` are mutations to the ECS data.
- `save()` reads from `this` using `defaults()` keys. Only saves fields that differ from defaults.

### Creating a new trait

1. Create `packages/engine/src/traits/<Name>Trait.ts` (capitalized to match the class name).
2. Extend `Trait<'componentName'>`.
3. Set `readonly component = 'componentName' as const`.
4. Add `declare` fields matching the component interface.
5. Implement `defaults()` returning the component's data shape.
6. Add constructor overrides if different entity types need different defaults.
7. Add an explicit import for the `@sf/state` type used as the return type of `defaults()` (e.g., `import type { Moisture } from '@sf/state'`). Engine-internal types like `Trait` are auto-imported.

## Systems

Systems are global functions that process all entities with certain components. They run in Phase 1, before entity type ticks. They can use raw `getComponent()` for bulk iteration — this is fine since the trait IS the component.

### When to use a system vs. an entity type tick

- **System**: Cross-entity interactions that need deduplication or global resolution (moisture equalization, combat, fluid flow). "The world acts on you."
- **Entity type tick**: Per-entity decisions based on resolved state (dirt→ground cover, AI behavior, FSM transitions). "You act in the world."

### Creating a new system

1. Create `packages/engine/src/systems/<name>.ts` (camelCase — systems export functions, not classes).
2. Export a `const mySystem: System = (world) => { ... }`.
3. Add it to `defaultSystems` in `tick.ts` (order matters — systems before `entityTypeTickSystem`).
4. Add explicit imports for `@sf/state` values used (e.g., `import { queryEntities, getComponent, type World } from '@sf/state'`). Engine-internal types like `System` and `BaseEntityType` are auto-imported.

## Entity Types

Each entity gets its own class instance. Traits are assigned as typed members via `this.addTrait()`.

### Simple terrain (no extra traits)

```ts
export class Sand extends BaseEntityType {
  type = 'sand'
}
```

### Entity with traits and ground cover

Ground cover (grass, moss, etc.) is a trait on the parent tile, not a separate entity.
The entity type's `tick()` sets the cover based on state (e.g. moisture threshold).
The renderer reads the `groundCover` component and overlays the appropriate sprite.

```ts
export class Dirt extends BaseEntityType {
  type = 'dirt'
  moisture = this.addTrait(new MoistureTrait(this.world, this.id, { current: 2, capacity: 10, conductivity: 20 }))
  groundCover = this.addTrait(new GroundCoverTrait(this.world, this.id))

  tick(): void {
    if (this.moisture.current >= GRASS_THRESHOLD) {
      this.groundCover.cover = 'grass'
    } else {
      this.groundCover.cover = null
    }
  }
}
```

### Complex entity with many traits

```ts
export class Player extends BaseEntityType {
  type = 'player'
  health = this.addTrait(new HealthTrait(this.world, this.id))
  hunger = this.addTrait(new HungerTrait(this.world, this.id))
  speed = this.addTrait(new SpeedTrait(this.world, this.id))
  playerControlled = this.addTrait(new PlayerControlledTrait(this.world, this.id))
}
```

### Creating a new entity type

1. Create `packages/engine/src/entityTypes/<Name>.ts` (capitalized to match the class name).
2. Extend `BaseEntityType`.
3. Set `type = '<name>'`.
4. Add traits as members via `this.addTrait(new SomeTrait(this.world, this.id))`.
5. Optionally override `tick()` for per-entity behavior (Phase 2). `tick()` takes no arguments — use `this.world`, `this.id`, and trait members.
6. Register the class constructor at startup in `bootstrap.ts` and test files.
7. Add explicit imports for `@sf/state` types if needed (e.g., `import type { World, EntityId } from '@sf/state'`). Engine-internal types like `BaseEntityType` and all traits are auto-imported.

### What an entity type class does NOT do

- **Does not manually call `addComponent()`.** Traits handle that.
- **Does not manually implement `import()`/`export()`.** `BaseEntityType` iterates traits automatically.
- **Does not extend other entity types.** No `extends Animal`. Shared behavior comes from shared traits and/or systems.

## Registration

Entity types are registered by class constructor at startup:

```ts
registerEntityType('dirt', Dirt)
```

Entities are spawned via:

```ts
spawnEntity(world, 'dirt', { position: { x: 5, y: 3, z: 0 } })
```

`spawnEntity()` creates the entity ID, instantiates the class, adds the `entityType` component, calls `init()` on all traits, and stores the instance in the ECS.

## Serialization

`BaseEntityType` handles import/export automatically:

- **Import**: `init()` iterates all traits. Each trait does `Object.assign(this, defaults, saved)` then stores itself in the ECS Map.
- **Export**: `export()` iterates all traits. Each trait compares current fields to defaults. Only saves fields that have changed.

This means:
- Forward-compatible: new fields in defaults get picked up on load.
- Minimal saves: transient/default components (like `playerControlled`) never appear in save files.

## Shared behavior without inheritance

Don't extend entity types from each other. If multiple entity types need the same behavior:
- **Same data**: Use the same trait.
- **Same cross-entity logic**: Create a system that queries for the relevant component.
- **Same per-entity logic**: Extract a helper function that entity type ticks can call.
