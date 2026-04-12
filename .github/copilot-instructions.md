# Survive Fortress — Copilot Instructions

## Auto-Imports & Global Types — No Explicit Imports

This project uses `unplugin-auto-import` and a global `types.d.ts` so that **all `@sf/core` values and types are available globally** without any imports.

### Rules

- **Do not add `import` statements for `@sf/core` values or types.** They are globally available via auto-imports and `types.d.ts` in all files (core, ui, and tests).
- `@sf/core/*` sub-paths are excluded from Vite's dependency pre-bundling (`optimizeDeps.exclude`) so the auto-import plugin can transform them.
- The generated `auto-imports.d.ts` files provide IDE support. They are generated automatically by vitest/vite — do not hand-edit them.

### What still needs explicit imports

- **Side-effect imports** for entity type self-registration (e.g. `import '../../core/src/entityTypes/dirt.js'`). These trigger the module so `registerEntityType()` runs.
- **Third-party libraries** like `vitest` (`import { describe, it, expect } from 'vitest'`).
- **Local non-core modules** like `import { Renderer } from './renderer.js'`.

### How it works

- `vitest.config.ts` exports a `coreImports` map that lists every public value from `@sf/core/*` sub-paths.
- Both `vitest.config.ts` and `packages/ui/vite.config.ts` feed this map to `unplugin-auto-import`.
- `packages/core/src/types.d.ts` uses `declare global` to make all `@sf/core` types ambient.
- `@sf/core` has no barrel `index.ts` — package.json `exports` map to sub-paths (`./ecs`, `./tick`, `./registry`, `./save`, `./serialization`).

### Adding new exports

When you add a new public function or type to `@sf/core`:
1. Export it from the relevant source file as usual.
2. If it's a **value**: add it to the `coreImports` map in `vitest.config.ts`.
3. If it's a **type**: add a corresponding `type X = Module.X` entry in `packages/core/src/types.d.ts`.
4. Run `yarn test` once to regenerate the `auto-imports.d.ts` files.

## Style

- No trailing semicolons in `.ts` files.
- Use `nvm use 22` before any yarn/node commands — the default system Node is too old.

### File & Directory Organization

- **Split unrelated but similar code into separate files** in a single directory. One class/system/trait per file. No barrel files (`index.ts`) — use sub-path exports or side-effect imports instead.
- **File names match the class they contain**, including capitalization. `Dirt.ts` exports `class Dirt`, `MoistureTrait.ts` exports `class MoistureTrait`. Files that export only non-class values (functions, constants) use camelCase: `moisture.ts`, `movement.ts`.
- **Directory names use camelCase or PascalCase**, matching JS naming conventions. No snake_case: `entityTypes/`, `traits/`, not `entity_types/`, `trait_files/`.

### Functions

- **Prefer `function` declarations** over arrow-const at the top scope: `export function foo()` not `export const foo = () =>`.
- Arrow functions are fine for anonymous callbacks, inline lambdas, and functions defined inside another function.

### Naming

- **Include units in variable names** when the value has an implicit unit. `durationMs` not `duration`, `tickIntervalMs` not `tickInterval`, `distanceTiles` not `distance`. Unitless values (counts, ratios, enums) don't need suffixes.
