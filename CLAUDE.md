# Survive Fortress

A survival sandbox where the world is alive without the player. Multi-package monorepo.

## How to use this index

The two docs imported below load with every session — they're the engineering and structural baseline. Everything else is on-demand: when starting a task, scan the list below and read the docs whose subject the task touches *before* writing code or proposing design. Don't read all of them; do read the relevant ones.

## Always-on

@docs/engineering.md
@docs/project-structure.md

## On-demand

- [docs/game-design.md](docs/game-design.md) — vision, aesthetic, what fun means, the game arc. Consult for UX, feature scoping, "should we add X" decisions, anything touching player experience.
- [docs/concepts/world-space.md](docs/concepts/world-space.md) — coordinate system, columns, screen mapping, painter's order. Consult when touching positioning, rendering, or anything spatial.
- [docs/concepts/turns.md](docs/concepts/turns.md) — simultaneous planning rounds, AP, plan/resolve phases. Consult when working on the planner, action submission, or tick orchestration.
- [docs/concepts/actions.md](docs/concepts/actions.md) — action handler shape and lifecycle. Consult when authoring a new action or changing dispatch.
- [docs/concepts/entities.md](docs/concepts/entities.md) — composition pattern, three-layer architecture, entity types, registration, serialization. Consult when adding or modifying a system or entity type.
- [docs/concepts/traits.md](docs/concepts/traits.md) — trait class shape, benefits, and authoring. Consult when adding or modifying a trait.
- [docs/concepts/vision.md](docs/concepts/vision.md) — per-entity visibility rules. Consult when touching what the client sees, occlusion, or the column-walk algorithm.
