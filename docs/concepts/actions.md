# Actions

Actions (`move`, `harvest`, `pickup`, `drop`, `eat`, …) are implemented as **registered handler objects**, not classes. The class-vs-handler distinction is covered in [engineering.md](../engineering.md#class-vs-handler).

## The handler shape

A handler is a plain object satisfying `ActionHandler<A>`, registered via `registerAction()` at module load. Each handler exposes:

- **`type`** — the discriminator value it dispatches on.
- **`cost(world, actorId, action)`** — number of ticks the action will spend; computed at the start, must be ≥ 1.
- **`validate(world, actorId, action)`** — preconditions, checked both at the start and again at completion.
- **`execute(world, actorId, action)`** — applied once, after `cost` ticks have elapsed.

## Lifecycle

The `actionSystem` drives each action through:

1. Look up the handler by `action.type`.
2. Call `validate()` — fail-fast, no ticks paid.
3. Tick `cost()` simulation steps.
4. Re-`validate()` (the world may have changed).
5. `execute()` the effect.

On any validation failure, the actor's plan terminates immediately.

## Authoring a new action

1. Add the new variant to the `Action` union in `@repo/state`.
2. Create a new file under `packages/engine/src/actions/`, named after the action. It should export nothing — its sole job is to call `registerAction({ type, cost, validate, execute })` at module load.
3. Add a side-effect `import` for the new file to the `actions/` index so the registration runs.
4. If the client needs to send it, extend the `PlayerAction` union in `@repo/server/sdk` so the wire shape includes it.
