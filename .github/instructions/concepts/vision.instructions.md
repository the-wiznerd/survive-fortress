# Vision

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
