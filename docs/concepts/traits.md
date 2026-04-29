# Traits

A trait is the unit of composition in this codebase: a class that owns one component's worth of data and exposes a typed API over it (`this.moisture.current`, methods like `this.health.heal(5)`). See [entities.md](entities.md) for how traits fit into the broader composition story.

Currently, traits also serve as their own ECS components — the trait instance is stored directly in the ECS Map, so `getComponent(world, id, 'moisture')` returns the trait itself with no indirection. The trait API doesn't depend on this; it would still work over different storage.

## Trait class shape

Each trait:

- Extends `Trait<K>` where `K` is the component name (e.g. `Trait<'moisture'>`).
- Declares its component identity as a const string literal: `readonly component = 'moisture' as const`.
- Declares typed fields with `declare`; they're populated at runtime by `init()`.
- Implements `defaults()` returning the component's default data shape.

When different entity types need different defaults for the same component, the trait's constructor accepts overrides. See `packages/engine/src/traits/` for the patterns in use — `HealthTrait` for the simplest fixed-default case, `MoistureTrait` for the constructor-override case.

## What traits give you

- **Auto-serialization.** `save()` only writes fields that differ from defaults; `init()` does `Object.assign(this, defaults, saved)`. Default-valued fields never hit the save file.
- **Typed access.** Entities and systems interact through trait fields and methods (`this.moisture.current`, `this.position.x`) — no `getComponent` boilerplate.
- **Forward-compatibility.** Adding a new defaulted field is automatic on load; existing saves don't need migration.

## Authoring a new trait

1. Create `packages/engine/src/traits/<Name>Trait.ts` (capitalized, matching the class name).
2. Extend `Trait<'componentName'>`, set `readonly component = 'componentName' as const`, add `declare` fields matching the component interface, and implement `defaults()`.
3. If different entity types need different defaults, accept overrides via the constructor.
4. Import the `@repo/state` type used as `defaults()`'s return type. `Trait` itself is engine-internal and auto-imported.
