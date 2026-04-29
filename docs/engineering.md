# Engineering

Conventions and preferences that apply across all packages. General code style baseline:

@~/.claude/preferences/code-style.md

## Imports

- **Tilde imports for same-package code.** Each package has a `~pkg` alias (e.g. `~engine/*`). Use it.
- **`@repo/*` for cross-package imports.**
- **No relative imports.** Never `./foo` or `../foo`. Always tilde or `@repo/`.

## File and directory organization

- One class, system, or trait per file. Group related-but-distinct concerns by directory.
- File names match what they export. `Dirt.ts` exports `class Dirt`. Files exporting only functions or constants use camelCase: `moisture.ts`.
- Directories use camelCase or PascalCase, never snake_case: `entityTypes/`, not `entity_types/`.

## Class vs. handler

> **If the thing has identity and per-instance state, use a class. If it's a pure transformation keyed by a discriminator, use a registered handler object.**

Traits and entity types are classes — each entity needs its own instance, fields, and lifecycle. Actions and similar discriminator-dispatched behaviors are handlers — the payload carries all the data, dispatch is a single map lookup, and there's no per-instance state.

For shared behavior between handlers, prefer helper functions over base classes. Inheritance for stateless behavior is usually more friction than reuse.

See [concepts/entities.md](concepts/entities.md) and [concepts/actions.md](concepts/actions.md) for how this plays out in practice.

## Local environment

Node version is pinned in `.nvmrc` (currently 22). The shell does **not** auto-switch. Before running `yarn`, `node`, or any script that shells out to them, run `nvm use` so the right version is active. Yarn 4 fails on older Node with a `fetch is not defined` crash.
