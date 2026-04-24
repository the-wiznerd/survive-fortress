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

## UX Design Principles

These four principles govern all client-side UI decisions. When a design choice conflicts with them, revisit the design rather than the principles.

### 1. Proximity — controls live near the thing they control
The player's eyes and cursor should not have to travel between the canvas and a distant panel without that travel feeling intentional and meaningful. Mouse travel is a proxy for cognitive effort. When an entity is on the canvas, its info and actions belong spatially close to it — ideally anchored to its canvas position via a DOM overlay, not in a sidebar far away.

### 2. Continuity — things that move should be seen to move
The brain tracks object identity spatially. When a thing disappears from one place and reappears in another without being seen to travel, the player loses track of it. Always provide a visual bridge — a particle, a flash, a toast — so the player's spatial model stays coherent. The canonical example: berries disappearing from a bush when harvested should *visibly travel* to the bag, not just vanish.

### 3. Unbroken feedback loops — live state must always be visible
Anything that changes over time and drives player decisions (health, hunger, AP budget, plan status) must be **always on screen, never behind a disclosure**. Collapsibles are for archival or secondary info. Watching your hunger bar climb while eating is satisfying; missing that because the hunger row was collapsed is not — it breaks the cause-and-effect contract with the player. Do not collapse live state.

### 4. Show, don't tell
The canvas is truth. Text labels and numbers are annotation. Prefer graphical representations of state (bars, icons, visual indicators) over prose descriptions. When in doubt: can a player understand what's happening by *watching*, rather than by reading?

---

## User Interaction & UI Architecture

The client is **pointer-first** (mouse or touch) and **DOM-first** (Vue for everything that isn't the world itself). These are the load-bearing rules for all UI work in this package.

### Pointer-first input

- Every gameplay action must be reachable using **only a mouse** or **only a touch screen**. Keyboard is not required for any action.
- Use the standard pointer corollaries: tap ↔ click, long-press ↔ hover/right-click. Don't gate functionality behind hover-only affordances; if a hover state reveals info or actions, a tap/long-press must reach the same.
- Gestures are fine when they work for both mouse and touch (drag, long-press, swipe). Avoid multi-touch-only gestures unless there's a single-pointer equivalent.
- **Canvas pointer handling stays minimal** — currently just inspect/select. Anything richer (action menus, confirmations, multi-step input) belongs in the DOM.
- **Interaction model:** select-then-act. Tap/click a target, then act on it via DOM controls (drawer buttons, contextual toolbar, etc.). When the target is unambiguous, skip the explicit select step to reduce friction.

### DOM-first UI

The canvas renders the **world**. Vue/DOM renders **everything else**.

- In the canvas: terrain, entities, world-anchored visual effects (e.g. queued move arrows, future damage numbers tied to a cell). Anything that requires participating in the world's z/y back-to-front sort belongs here.
- In the DOM: HUD, drawers, modals, toasts, notifications, buttons, menus, inventory grids, tooltips, cursors-of-intent, callouts. If it's a *control* or doesn't need world-space ordering, it's DOM.
- DOM overlays may be absolutely positioned over the canvas using world↔screen coordinate helpers (we already have `screenToWorld`; add the inverse as needed). This is preferred over rebuilding UI primitives in canvas.
- **UI state lives in Vue** (refs, composables, small modules like `sidebarStack.ts`) — not in the renderer. The renderer reads game view state; it does not own UI state.

### Accessibility & browser conventions

A11y is **aspirational, not gated**. The target audience is sighted users with a working pointer. That said:

- Use semantic HTML and native controls (`<button>`, `<details>`, `<dialog>`, `<input>`, etc.) rather than rebuilding them on `<div>`. You get focus, keyboard, ARIA roles, and platform conventions for free.
- Respect user agent settings: size in `rem`/`em` (not `px`) for anything text-related, honor `prefers-reduced-motion` for non-essential animation, use logical properties (`inline-size`, `block-start`, etc.) where reasonable.
- Don't fight native browser behavior (focus rings, scroll, text selection, context menus on form fields). Suppress only when it actively breaks the experience (e.g. context menu on the canvas itself).
- Use `role="status"` / `aria-live="polite"` for transient notifications and toasts.
- Tab order and full keyboard navigation are not requirements; don't go out of your way to break them either.

### Layout target

Design for **desktop first** (mouse + reasonably wide viewport). Responsive/mobile layouts come later, after systems mature. Don't pre-optimize for narrow viewports, but don't bake in fixed pixel layouts that would be painful to make fluid later — prefer flex/grid and relative units by default.

### When in doubt

- "Can I build this with Vue and CSS?" → do that.
- "Does this need to sort with world entities?" → canvas.
- "Does this need a hover state to be usable?" → redesign so it doesn't.
- "Should I add a hotkey / gesture / long-press?" → not yet. Add the simplest conventional control first; layer in shortcuts only when a real need appears.

## Imports

Use tilde imports for all within-package imports: `import { Renderer } from '~client/rendering/renderer.js'`. Use `@repo/server/sdk` for server SDK imports. Never use relative imports.

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
- `edgeFlags()` — Returns `{ n, e, s, w }` (0 or 1) based on neighboring terrain elevation
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
- `FRONT_VARIANT`: `FLAT`, `E`, `W`, `EW`, `S`, `SE`, `SW`, `SEW`

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
