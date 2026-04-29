# Vision

Vision is per-entity, defined by two parameters: **horizontalRange** and **verticalRange**. Only entities at visible positions are sent to the client; the client never receives data about positions outside the player's vision.

## Horizontal scope

All columns within a circular radius of `horizontalRange` around the entity's (x, y). Vision does not ray-cast horizontally — if a column is within range, it's checked. Only z-axis (vertical) occlusion matters.

## Vertical scope

Each column is searched in two directions from the entity's z. Both walks have the same two-phase structure: a **clear phase** (before the first occluder) and a **cliff-face phase** (after the first occluder).

### Downward (entity.z toward entity.z − verticalRange)

- **Clear phase**: every position with entities is visible. Non-opaque entities (e.g. water) don't stop the walk. The first opaque position is included and triggers the transition to cliff-face phase.
- **Cliff-face phase**: only opaque tiles with at least one exposed cardinal side face (a N/S/E/W neighbor that is not opaque) are visible. Fully enclosed tiles are skipped.

### Upward (entity.z + 1 toward entity.z + verticalRange)

- **Clear phase**: same as downward — non-opaque entities are visible; the first opaque position is included and triggers cliff-face phase.
- **Cliff-face phase**: same as downward — only opaque tiles with an exposed cardinal side face are visible.

### Cliff-face rationale

After hitting a solid occluder, the player can still see tiles beyond it that have an exposed side — like looking down (or up) a cliff wall. Tiles fully enclosed in opaque terrain are hidden.
