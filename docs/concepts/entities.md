# Entities, traits, and systems

The simulation builds entities by **composing traits**. Each entity's behavior and characteristics come from the traits it holds — its moisture, its health, its position, whether it's player-controlled — plus a small amount of per-entity **glue logic** (typically a finite-state machine) that reads its own traits, reads neighboring entities' traits, and decides what to do each tick.

This is a specific flavor of composition. ECS purists may not consider it "true" composition, since traits hold methods, not just data, and callers reach typed fields directly (`this.moisture.current`) rather than going through `getComponent()`. That tradeoff is deliberate: **traits are an API layer**, and the storage substrate underneath — currently ECS Maps — is an implementation detail the trait layer abstracts away. If we ever swap storage, callers don't change.

Three roles, top to bottom:

- **Entity types** — per-instance classes that own composition (which traits this kind of entity has) and per-entity glue logic (`tick()`, FSM transitions).
- **Traits** — small typed APIs over single components. The unit of composition. See [traits.md](traits.md).
- **Systems** — global per-tick functions that lift cross-entity logic out of any single entity (moisture flowing between adjacent tiles, combat resolution, fluid pressure).

## The two phases of a tick

```
Phase 1 — Systems (the world acts on you)
  Cross-entity resolution: moisture equalization, hunger drain,
  movement, fluid flow, etc.

Phase 2 — Entity type ticks (you act in the world)
  Per-entity decisions: dirt checks moisture and updates ground cover,
  AI picks a next action, FSMs transition state.
```

Systems run first and resolve global state. Entity type ticks then orchestrate per-entity behavior on top of that resolved state.

## Systems

Systems are global functions that process every entity with a relevant component. They run in Phase 1, before entity type ticks. Systems can use raw `getComponent()` for bulk iteration — fine, since the trait *is* the component.

### When to use a system vs. an entity type tick

- **System**: cross-entity interactions needing deduplication or global resolution (moisture equalization, combat, fluid flow). "The world acts on you."
- **Entity type tick**: per-entity decisions based on already-resolved state (dirt → ground cover, AI behavior, FSM transitions). "You act in the world."

### Authoring a new system

1. Create `packages/engine/src/systems/<name>.ts` — camelCase; systems are functions, not classes.
2. Export a `System` (`(world) => { ... }`) that does the work.
3. Add it to `defaultSystems` in `tick.ts`. Order matters; systems run before `entityTypeTickSystem`.
4. Import any `@repo/state` values you need (`queryEntities`, `getComponent`, `World`). Engine-internal types like `System` are auto-imported.

## Entity types

Each entity gets its own class instance. Entity type classes:

- Extend `BaseEntityType`.
- Set `type = '<name>'` to register their kind.
- Compose traits as typed members via `this.addTrait(new SomeTrait(this.world, this.id, overrides?))`.
- Optionally override `tick()` for per-entity logic in Phase 2. `tick()` takes no arguments — use `this.world`, `this.id`, and trait members.

A minimal entity type just sets `type` and adds nothing (e.g. `Sand`). A typical one composes a handful of traits and runs an FSM in `tick()` (e.g. `Dirt` checks its moisture and updates its ground-cover trait). See `packages/engine/src/entityTypes/` for the patterns.

### What an entity type does NOT do

- **Does not call `addComponent()` directly.** Traits handle that via `addTrait()`.
- **Does not implement `import()` / `export()`.** `BaseEntityType` iterates traits automatically.
- **Does not extend other entity types.** No `extends Animal`. Shared behavior comes from shared traits or shared systems — see "Shared behavior without inheritance" below.

### Authoring a new entity type

1. Create `packages/engine/src/entityTypes/<Name>.ts`.
2. Extend `BaseEntityType`, set `type = '<name>'`, add traits as members.
3. Optionally override `tick()`.
4. Register the class at startup via `registerEntityType('<name>', <Class>)`. Test setups need to register too.
5. Import any `@repo/state` types you need (`World`, `EntityId`). `BaseEntityType` and traits are auto-imported.

## Registration and spawning

Entity types are registered by name at startup; entities are spawned by name through `spawnEntity(world, '<type>', { position, ... })`. The spawn helper creates the entity ID, instantiates the registered class, adds the `entityType` component, and calls `init()` on all traits.

## Serialization

`BaseEntityType` handles import and export automatically by iterating each entity's traits:

- **Import**: each trait does `Object.assign(this, defaults, saved)` and stores itself in the ECS Map.
- **Export**: each trait compares current fields to defaults and writes only the differences.

Two consequences worth knowing:

- **Saves are minimal.** Transient or default-valued components (e.g. `playerControlled`) don't appear in save files.
- **Forward-compatibility is automatic.** New defaulted fields appear on load without migration.

## Shared behavior without inheritance

Don't extend entity types from each other. If multiple entity types need the same behavior:

- **Same data** → use the same trait.
- **Same cross-entity logic** → write a system that queries for the relevant component.
- **Same per-entity logic** → extract a helper function that entity type ticks call.

For the broader principle (when classes vs. handlers are appropriate), see [engineering.md](../engineering.md#class-vs-handler).
