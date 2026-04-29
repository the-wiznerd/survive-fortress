# Actions

Actions (`move`, `harvest`, `pickup`, `drop`, `eat`, …) are implemented as
**registered handler objects**, not classes. Each handler is a plain object
satisfying `ActionHandler<A>` and registered via `registerAction()` at module
load time.

## The handler shape

```ts
export interface ActionHandler<A extends Action = Action> {
  type: A['type']
  cost(world, actorId, action): number     // ticks; ≥ 1; computed at start
  validate(world, actorId, action): boolean // checked at start and at completion
  execute(world, actorId, action): void     // applied once, after `cost` ticks
}
```

The `actionSystem` drives the lifecycle:

1. Look up the handler by `action.type`.
2. Call `validate()` — fail-fast, no ticks paid.
3. Tick `cost(...)` simulation steps.
4. Re-`validate()` (world may have changed).
5. `execute()` the effect.
6. On any validation failure the actor's plan terminates immediately.

## Authoring a new action

1. Add the new variant to the `Action` union in `@repo/state`.
2. Create `packages/engine/src/actions/<name>.ts` exporting nothing — the file
   should only call `registerAction({ type, cost, validate, execute })`.
3. Add a side-effect `import './<name>.js'` to `actions/index.ts`.
4. If the client needs to send it, extend `PlayerAction` in
   `packages/server/src/sdk/types.ts` and the corresponding `appendXxx` helper
   in the client.
