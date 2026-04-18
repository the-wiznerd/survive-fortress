# Survive Fortress — Copilot Instructions

## Monorepo Structure

This is a Yarn 4 workspaces monorepo with Turborepo orchestration. Four packages under `packages/`:

- **`@repo/state`** — ECS, spatial index, save types. No dependencies.
- **`@repo/engine`** — Traits, systems, entity types, registry, serialization. Depends on `@repo/state`.
- **`@repo/server`** — Server internals + client SDK (dual export: `.` and `./sdk`). Depends on `@repo/state` + `@repo/engine`.
- **`@repo/client`** — Vite app: renderer, sidebar, input, web components. Depends on `@repo/server`.

Each library package (state, engine, server) builds to `dist/` with Vite lib mode + `vite-plugin-dts`. Package.json exports point to `dist/` (both `import` and `types`). `turbo build` runs them in dependency order.

## Import Conventions

Each package has a `~pkg` path alias in both vite.config.ts and tsconfig.json (e.g., `~engine/*` → `./src/*`).

### Rules

- **Use tilde imports for same-package imports.** Example: `import { Trait } from '~engine/traits/Trait.js'` in engine code.
- **Use explicit `@repo/` imports for cross-package dependencies.** Example: `import { createWorld, type World } from '@repo/state'` in engine code.
- **Never use relative imports** (`./` or `../`). Always use tilde aliases.
- **Third-party libraries** like `vitest` need explicit imports (`import { describe, it, expect } from 'vitest'`).

### Adding new exports

When you add a new public function or type to a package:
1. Export it from the relevant source file as usual.
2. If it should be part of the package's public API, re-export it from `src/index.ts`.
3. Run `turbo build` to regenerate declaration files.

## Server SDK

The client interacts with the game exclusively through `@repo/server/sdk`:

- `Game` interface: `onViewUpdate`, `sendAction`, `inspect`, `start`, `stop`, `getView`
- `ViewEntity`: plain data (no ECS classes) — `id`, `type`, `x`, `y`, `z`, `traits`
- `createLocalGame(loadSave)` accepts raw JSON `{ manifest, chunks }`, handles engine internals
- The client never imports from `@repo/state` or `@repo/engine` directly

## Key Commands

- `nvm use` before any yarn/node commands to use the correct Node version
- `yarn dev`  builds deps + starts client dev server (Turborepo)
- `yarn build` full production build all packages
- `yarn test` engine tests (vitest, 20 tests)
- `yarn typecheck` tsc --noEmit all packages
- `yarn dev:kill` kill dev servers on ports 5173-5175

## Style

- No trailing semicolons in `.ts` files.

### File & Directory Organization

- **Split unrelated but similar code into separate files** in a single directory. One class/system/trait per file.
- **Directory names use camelCase or PascalCase**, matching JS naming conventions. No snake_case: `entityTypes/`, `traits/`, not `entity_types/`, `trait_files/`.
- **File names match the class they contain**, including capitalization. `Dirt.ts` exports `class Dirt`, `MoistureTrait.ts` exports `class MoistureTrait`. Files that export only non-class values (functions, constants) use camelCase: `moisture.ts`, `movement.ts`.

### Functions

- **Prefer `function` declarations** over arrow-const at the top scope: `export function foo()` not `export const foo = () =>`.
- Arrow functions are fine for anonymous callbacks, inline lambdas, and functions defined inside another function.

### Naming

- **Include units in variable names** when the value has an implicit unit. `durationMs` not `duration`, `tickIntervalMs` not `tickInterval`, `distanceTiles` not `distance`. Unitless values (counts, ratios, enums) don't need suffixes.

## Collaboration

- **Discuss before implementing** when the user asks exploratory questions like "is there a way", "how should we", "what do you think", or "ideas?". Present options and tradeoffs, then wait for the user's go-ahead before writing code.
- The user is an integral part of the software architecture. Treat design decisions as collaborative — don't pick an approach and implement it unilaterally.
