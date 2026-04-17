---
applyTo: "packages/client/**"
description: "Client architecture — rendering pipeline, entity renderers, trait display, Vue components, auto-imports, and sprite sheet conventions."
---

# Client Package (`@repo/client`)

## Architecture Overview

The client is a Vite + Vue 3 app that renders the game on a `<canvas>` element and displays entity details in a Vue sidebar. It depends only on `@repo/server/sdk` — never on `@repo/state` or `@repo/engine` directly.

### Key modules

| Module | Purpose |
|---|---|
| `renderer.ts` | Canvas rendering: camera, sprite sheet, 3-pass render pipeline, silhouette/occlusion |
| `game.ts` | Loads save data, creates `LocalGame` via server SDK, wires tick loop and player actions |
| `input.ts` | Keyboard/mouse: arrow movement, space+arrow queuing, cell inspection, hover tracking |
| `rendering/types.ts` | `DrawContext`, `RenderContext`, `TerrainVariants`, sprite constants, edge/terrain helpers |
| `rendering/entities/` | One `EntityRenderer` subclass per entity type |
| `traitRenderers.ts` | Maps `VisibleTraitName` → Vue component + props factory for sidebar display |
| `colors.ts` | JS mirror of the SCSS color palette for use in Canvas code |
| `components/` | Vue components: `Sidebar`, `EntityCard`, trait display components |

### Data flow

```
Server SDK (GameView)
  → game.ts stores view, wires tick callbacks
  → App.vue provides view + inspect data to Vue tree via provide/inject
  → renderer.ts draws entities on canvas each animation frame
  → Sidebar.vue / EntityCard.vue show selected entity details
```

## Auto-Imports

`unplugin-auto-import` scans three directories and makes all exports globally available **within the client package**:

- `src/`
- `src/rendering/`
- `src/rendering/entities/`

This means `DrawContext`, `EntityRenderer`, `terrainVariants`, `CELL_W`, `posKey`, `zKey`, all renderer classes, and other exports from these dirs need no import statement. The generated `auto-imports.d.ts` provides IDE support.

**Not auto-imported:** Vue components in `src/components/` and third-party libraries. These require explicit imports.

## Rendering Pipeline

### Sprite sheet

The sprite sheet is at `public/sprites/sprites.png`. Cells are 16×12 pixels (`CELL_W` × `CELL_H`). Each cell is one face (top or front) of a terrain tile or one frame of a character sprite.

### Render passes

The renderer runs 3 passes per frame, all back-to-front by row:

1. **Terrain** — Entities where `renderer.terrain === true`. Sorted by z, then y. Each draws via `DrawContext.drawTerrain()` or custom logic.
2. **Movement arrows** — Queued move indicators for the player.
3. **Upright entities** — Non-terrain entities (player, creatures). Handles occlusion: if an upright entity is behind terrain, it renders as a split silhouette.

### DrawContext

`DrawContext` is the per-entity drawing API. Created by the renderer for each entity, it provides:

- `draw(col, row, w?, h?, yOff?)` — Blit from sprite sheet to screen
- `drawTerrain(tv: TerrainVariants)` — Draw top face + conditional front face with edge-aware variant selection
- `edgeFlags()` — Returns `{ n, e, w }` (0 or 1) based on neighboring terrain elevation
- `frontOccluded` — Whether the front face is hidden by terrain in the next row
- `wx`, `wy`, `z` — World coordinates
- `rc` — The shared `RenderContext` with spatial lookup maps

### TerrainVariants and the sprite layout convention

Terrain tiles follow a standard 11-column layout per material:

```
Base+0  flat top       Base+5  N top
Base+1  W top          Base+4  NW top
Base+2  E top          Base+6  NE top
Base+3  EW top         Base+3  NEW top (same as EW)

Base+9  flat front     Base+7  EW front
Base+8  W front        Base+10 E front
```

Use `terrainVariants(row, baseCol)` to build a `TerrainVariants` object from a sprite row and base column. Named index constants:

- `TOP_VARIANT`: `FLAT`, `N`, `E`, `W`, `NE`, `NW`, `EW`, `NEW`
- `FRONT_VARIANT`: `FLAT`, `E`, `W`, `EW`

## Entity Renderers

Each entity type has a renderer in `src/rendering/entities/`. Renderers extend `EntityRenderer`:

```ts
export abstract class EntityRenderer {
  readonly terrain: boolean = false    // drawn in terrain pass?
  readonly occluding: boolean = true   // hides front face of row behind?
  abstract render(entity: ViewEntity, dc: DrawContext): void
  describeTraits(entity: ViewEntity): VisibleTraitName[] { return [] }
}
```

### Creating a new entity renderer

1. Create `src/rendering/entities/<Name>Renderer.ts`.
2. Extend `EntityRenderer`.
3. Set `terrain = true` for terrain tiles.
4. Implement `render()` using `dc.draw()` or `dc.drawTerrain()`.
5. Override `describeTraits()` to list traits shown in the sidebar.
6. Register the renderer in `ENTITY_RENDERERS` in `renderer.ts`:
   ```ts
   const ENTITY_RENDERERS: Record<string, EntityRenderer> = {
     // ...existing...
     myType: new MyTypeRenderer(),
   }
   ```
7. The class is auto-imported (scanned from `src/rendering/entities/`), so no import needed in `renderer.ts`.

### Terrain renderer example

```ts
const SAND = terrainVariants(0, 11)

export class SandRenderer extends EntityRenderer {
  readonly terrain = true

  render(entity: ViewEntity, dc: DrawContext) {
    dc.drawTerrain(SAND)
  }
}
```

## Trait Display (Sidebar)

The sidebar shows entity details when a cell is inspected (clicked). Each entity card displays traits returned by the entity renderer's `describeTraits()`.

### Pipeline

```
EntityRenderer.describeTraits()  →  trait names
  → EntityCard.vue iterates names
  → renderTrait(name, data) looks up TRAIT_RENDERERS
  → returns { component, props }
  → <component :is="..." v-bind="..." /> renders it
```

### Adding a new trait to the sidebar

1. **Add the view type** to `TraitViews` in `packages/server/src/sdk/types.ts`.
2. **Add a renderer entry** in `traitRenderers.ts` mapping the trait name to a Vue component and props factory.
3. **Add the trait name** to `describeTraits()` in the relevant entity renderer(s).

Use existing `StatText` for simple label/value display, or create a new component in `src/components/traits/` for custom rendering. See `traitRenderers.ts` for the current registry and examples.

## Vue Components

Components live in `src/components/` and are **not** auto-imported — use explicit imports.

- `App.vue` — Root: canvas + sidebar. Provides `view`, `inspectedCell`, `inspectResult`, `getTraitNames` via `provide()`.
- `Sidebar.vue` — Injects provided data. Shows day/tick, player entity card, inspected cell entities.
- `EntityCard.vue` — Displays one entity: name/type label, position, and dynamic trait components.

## Styles

SCSS files in `src/styles/`, imported via `main.ts`:

| File | Purpose |
|---|---|
| `_reset.scss` | Cascade layer reset |
| `_fonts.scss` | @font-face declarations (Dogica, Pixel Operator) |
| `_variables.scss` | CSS custom properties (colors, fonts) |
| `styles.scss` | Layout and component styles |

Color values used in Canvas code (e.g. silhouette rendering) come from `colors.ts`, which mirrors the SCSS palette.
