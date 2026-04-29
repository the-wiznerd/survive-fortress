# Project structure

Yarn 4 + Turborepo monorepo. The simulation runs in TypeScript packages; the active client is a Godot/GDScript app that talks to a TypeScript server over a network protocol.

## Packages

Dependency direction flows one way: lower layers don't import from higher ones.

### Core simulation (TypeScript)

- **`@repo/state`** — ECS world, spatial index, save shape. The data layer; no `@repo/*` dependencies.
- **`@repo/engine`** — Traits, systems, entity types, action handlers, serialization. Reads and writes `@repo/state`.
- **`@repo/server`** — Hosts a game instance and exposes a network surface. Dual export: server internals (`.`) and the **client SDK** (`./sdk`).

### Active client

- **`packages/client-godot/`** — Godot project (GDScript). Talks to `@repo/server` over its network protocol; never imports TypeScript packages directly.

### Inactive

- **`@repo/client`** — *Legacy.* Vue + canvas client. Slated for removal.
- **`@repo/editor`** — *Legacy.* Vue + canvas level editor. Slated for removal.
- **`@repo/rendering`** — *Legacy.* Rendering abstractions (e.g. drawing a terrain tile from a spritesheet at a given world position) shared by the Vue client and editor. Slated for removal — Godot handles its own rendering.
- **`@repo/editor-server`** — *Dormant.* Exposes engine/storage APIs that the normal client SDK doesn't surface; was used to build test worlds via the Vue editor. Kept for a possible future Godot-based map editor.

## The SDK as a boundary

Clients consume the simulation only through `@repo/server/sdk`. They never import `@repo/state` or `@repo/engine` directly. The Godot client talks to `@repo/server` over the network rather than via SDK imports — the conceptual boundary is the same: the SDK defines what a client is allowed to know.

When changing `@repo/state` or `@repo/engine`, ask whether the change leaks through the SDK. Internal refactors should not change the client view.

## Adding a public export

When a function or type should be part of a package's public API:

1. Export it from its source file.
2. Re-export it from `src/index.ts` (or `src/sdk/index.ts` for SDK members).
3. Run `turbo build` so dependent packages see the regenerated declarations.
