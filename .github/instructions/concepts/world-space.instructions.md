# World Space

The game world is a 3D grid of integer positions **(x, y, z)**.

- **x** — East/West axis (positive = east)
- **y** — North/South axis (positive = south)
- **z** — Elevation (positive = up)

**z = 0** is "sea level." Negative z values exist (e.g. riverbeds, underground).

# Columns

A **column** is all entities at the same (x, y) across all z-levels. Entities stacked vertically share the same column — a dirt at (5, 3, 0) is directly below a dirt at (5, 3, 1).

# Screen Space

The client renders a 2D isometric-style top-down grid. Each world position maps to a screen cell:

- **Screen column** = world x
- **Screen row** = world y − world z

This means elevation shifts entities upward on screen. Two entities at different world positions can overlap the same screen cell if their y and z differ by the same amount — e.g. world (0, 0, 0) and (0, 1, 1) both map to screen row 0--almost, differences in cell height (front faces) and cell "depth" (top faces) mean rows stacked in game space don't exactly line up with the rows behind them and down.

The z component does not appear as a spatial axis on screen. Instead, it becomes **draw order and occlusion**.

# Painter's Order

Within any given (x, y) screen cell, multiple entities may overlap visually. Sort order — what paints over what — is **row-major**, not z-major:

1. **By world y first.** All entities in a more northern row paint before any entity in a more southern row. The player at `(x, y, z=0)` is *in front of* a 5-tall stone column at `(x, y-1, *)` because the player's world-space root is closer to the camera; nothing in that column can occlude the player regardless of how tall it is. Same idea for any actor walking south of any terrain feature.

2. **By world z within the same row.** When two entities share a world y, the higher-z one paints later (on top of) the lower-z one. So an actor at `(x, y, z=1)` standing on dirt at `(x, y, z=0)` paints over the dirt's front face — its feet are not clipped by the tile it stands on.

3. **By kind within the same row + same z.** Terrain-class entities paint before non-terrain entities. So a bush at `(x, y, z=0)` paints over the dirt at `(x, y, z=0)` even though they share both y and z.

This is equivalent to iterating screen rows north-to-south, and within each row drawing all terrain low-to-high then all uprights low-to-high.