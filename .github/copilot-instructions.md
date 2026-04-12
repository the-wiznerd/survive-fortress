# Survive Fortress — Copilot Instructions

## Auto-Imports & Global Types — No Explicit Imports

This project uses `unplugin-auto-import` and a global `types.d.ts` so that **all core values and types are available globally** without any imports.

### Rules

- **Do not add `import` statements for core values or types.** They are globally available via auto-imports and `types.d.ts` in all files (core, ui, and tests).
- The generated `auto-imports.d.ts` file provides IDE support. It is generated automatically by vitest/vite — do not hand-edit it.

### What still needs explicit imports

- **Third-party libraries** like `vitest` (`import { describe, it, expect } from 'vitest'`).
- **Local non-core modules** like `import { Renderer } from './renderer.js'`.

### How it works

- `vite.config.ts` uses `scanExports()` to discover all exports from `src/core/` and its subdirectories.
- The export map is fed to `unplugin-auto-import`, which injects imports automatically at build time.
- `src/core/types.d.ts` uses `declare global` to make all core types ambient.

### Adding new exports

When you add a new public function or type to `src/core/`:
1. Export it from the relevant source file as usual.
2. If it's a **type**: add a corresponding `type X = Module.X` entry in `src/core/types.d.ts`.
3. **Values** are auto-discovered by `scanExports()` — no manual config changes needed.
4. Run `yarn test` once to regenerate the `auto-imports.d.ts` file.

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

## Collaboration

- **Discuss before implementing** when the user asks exploratory questions like "is there a way", "how should we", "what do you think", or "ideas?". Present options and tradeoffs, then wait for the user's go-ahead before writing code.
- The user is an integral part of the software architecture. Treat design decisions as collaborative — don't pick an approach and implement it unilaterally.
