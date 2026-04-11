# Survive Fortress — Copilot Instructions

## Auto-Imports & Global Types — No Explicit Imports

This project uses `unplugin-auto-import` and a global `types.d.ts` so that **all `@sf/core` values and types are available globally** without any imports.

### Rules

- **Never add `import` statements for `@sf/core` values or types.** They are already globally available.
- Values (`createWorld`, `addComponent`, `getComponent`, `tick`, `registerEntityType`, etc.) are auto-imported by the plugin at build/test time.
- Types (`World`, `EntityId`, `Action`, `Position`, `EntityTypeDef`, `ChunkData`, etc.) are declared globally via `packages/core/src/types.d.ts`.
- The generated `auto-imports.d.ts` files provide IDE support. They are generated automatically by vitest/vite — do not hand-edit them.

### What still needs explicit imports

- **Side-effect imports** for entity type self-registration (e.g. `import '../../core/src/entityTypes/dirt.js'`). These trigger the module so `registerEntityType()` runs.
- **Third-party libraries** like `vitest` (`import { describe, it, expect } from 'vitest'`).
- **Local non-core modules** like `import { Renderer } from './renderer.js'`.

### How it works

- `vitest.config.ts` exports a `coreImports` map that lists every public value from `@sf/core/*` sub-paths.
- Both `vitest.config.ts` and `packages/dev-ui/vite.config.ts` feed this map to `unplugin-auto-import`.
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
