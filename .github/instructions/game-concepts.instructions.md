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

The player has a **VisionTrait** with `range` and `upward` properties:

- **range** — Circular (Euclidean) horizontal radius in columns around the player.
- **upward** — How many z-levels above the player are visible.
- **downward** — Unlimited. The player can see down through any non-opaque terrain.

At each column within range, visibility walks top-down from `player.z + upward` to the world's minimum z. **Opaque terrain** (OccludingTrait with `opaque: true`) blocks visibility of everything below it in that column. Non-opaque terrain (e.g. water) does not block.

Only entities at visible positions are sent to the client. The client never receives data about positions outside the player's vision.
