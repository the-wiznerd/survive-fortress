---
description: "Game concepts and terminology — world space, screen space, columns, elevation, and vision."
---

# Game Concepts & Terminology

## World Space

The game world is a 3D grid of integer positions **(x, y, z)**.

- **x** — East/West axis (positive = east)
- **y** — North/South axis (positive = south)
- **z** — Elevation (positive = up)

**z = 0** is "sea level." Negative z values exist (e.g. riverbeds, underground).

## Columns

A **column** is all entities at the same (x, y) across all z-levels. Entities stacked vertically share the same column — a dirt at (5, 3, 0) is directly below a dirt at (5, 3, 1).

## Screen Space

The client renders a 2D isometric-style top-down grid. Each world position maps to a screen cell:

- **Screen column** = world x
- **Screen row** = world y − world z

This means elevation shifts entities upward on screen. Two entities at different world positions can occupy the same screen cell if their y and z differ by the same amount — e.g. world (0, 0, 0) and (0, 1, 1) both map to screen row 0.

The z component does not appear as a spatial axis on screen. Instead, it becomes **draw order and occlusion**: higher-z entities are drawn later and can visually overlap lower-z entities in the same or adjacent screen cells.

## Vision

Vision is per-entity, defined by two parameters: **horizontalRange** and **verticalRange**.

**Horizontal scope:** All columns within a circular radius of `horizontalRange` around the entity's (x, y).

**Vertical scope per column — two walks from entity z:**

Each column is searched in two directions. Both walks have the same two-phase structure: a **clear phase** (before the first occluder) and a **cliff-face phase** (after the first occluder).

**Downward (from entity z toward `entity.z − verticalRange`):**

- **Clear phase:** Every position with entities is visible. Non-opaque entities (e.g. water) don't stop the search. The first opaque position is included and triggers the transition to cliff-face phase.
- **Cliff-face phase:** Only opaque tiles that have at least one exposed cardinal side face (N/S/E/W neighbor is not opaque) are visible. Fully surrounded tiles are skipped.

**Upward (from `entity.z + 1` toward `entity.z + verticalRange`):**

- **Clear phase:** Non-opaque entities are visible. The first opaque position is always included and triggers cliff-face phase.
- **Cliff-face phase:** Same as downward — only opaque tiles with an exposed cardinal side face are visible.

**Cliff-face rationale:** After hitting a solid occluder, the player can still see tiles beyond it that have an exposed side — like looking down (or up) a cliff wall. Tiles fully enclosed in opaque terrain are hidden.

**No X/Y plane occlusion.** Vision does not ray-cast horizontally — if a column is within range, it's checked. Only z-axis (vertical) occlusion matters.

Only entities at visible positions are sent to the client. The client never receives data about positions outside the player's vision.
