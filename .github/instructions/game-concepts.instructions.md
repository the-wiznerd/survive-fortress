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

Vision is per-entity, defined by two parameters: **horizontal range** and **vertical range**.

**Horizontal scope:** All columns within a circular radius of `horizontal range` around the entity's (x, y).

**Vertical scope per column — two searches from entity z:**

**Downward (from entity z toward lower z):**

- Find the highest occluder at or below the entity's z in this column, bounded by `entity.z - vertical range`.
- Everything between the entity's z and that occluder (inclusive) is visible.
- If the occluder is at the entity's own z, nothing below is visible in this column.
- If no occluder is found, everything down to the floor of the search range is visible.
- Non-opaque entities (e.g. water) are visible but don't stop the search.

**Upward (from entity z toward higher z):**

- Walk upward from entity z to `entity.z + vertical range`.
- All entities encountered are visible, including occluders.
- The first occluder stops the search and marks the column as having a **ceiling**.
- If no occluder is found within the range, check whether any occluder exists above the range. If one does, the column still has a ceiling. If not, the column is open sky.

**No X/Y plane occlusion.** Vision does not ray-cast horizontally — if a column is within range, it's checked. Only z-axis (vertical) occlusion matters.

**Ceiling** is a per-column flag indicating that the entity is "indoors" or "underground" in that column — there's opaque terrain somewhere above the visible range.

Only entities at visible positions are sent to the client. The client never receives data about positions outside the player's vision.
