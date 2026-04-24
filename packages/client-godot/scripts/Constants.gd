class_name Constants
extends Object

## Mirrors packages/rendering/src/constants.ts.
## Pseudo-isometric pixel projection: an entity at world (x, y, z) renders at
## screen position (x * TILE_W, y * TOP_FACE_H - z * FRONT_FACE_H).

## Simulated pixel size for UI chrome (dividers, notches, etc). The UI is not
## actually scaled — this is just the unit we measure pixelated UI features
## in so they read as chunky pixels regardless of camera zoom.
const UI_PIXEL: int = 2

## Width of a tile in pixels (shared by all cell types).
const TILE_W: int = 16
## Height of a non-terrain sprite cell in the sprite sheet.
const SPRITE_H: int = 12
## Height of a terrain top face and the grid row step.
const TOP_FACE_H: int = 12
## Height of a terrain front (side) face.
const FRONT_FACE_H: int = 10
## Per-row pixel height in the procedurally baked terrain atlas. Each row of the
## atlas is sized to fit the taller of TOP_FACE_H and FRONT_FACE_H so a single
## row spacing works for both face kinds.
const ATLAS_ROW_H: int = 12

## Number of ticks in one in-game day. Mirrors `TICKS_PER_DAY` in
## packages/state/src/ecs.ts.
const TICKS_PER_DAY: int = 100

## Sort position for an entity at world (x, y). Used as the EntityNode's
## `position` so Godot's Y-sort orders entities row-by-row (north → south),
## independent of elevation. The visual z-offset is applied separately to a
## child node so it doesn't influence sort order.
static func sort_position(x: int, y: int) -> Vector2:
	return Vector2(x * TILE_W, y * TOP_FACE_H)

## Visual offset applied to an entity's child "_visual" node so its sprite is
## painted at the elevation-shifted screen position without affecting Y-sort.
static func visual_offset_for_z(z: int) -> Vector2:
	return Vector2(0, -z * FRONT_FACE_H)

## Project a world position to screen pixels (sort position + visual z offset).
## Use only for camera targeting and the like — do NOT set EntityNode.position
## to this; use sort_position() + apply visual_offset_for_z() to the visual child.
static func project(x: int, y: int, z: int) -> Vector2:
	return sort_position(x, y) + visual_offset_for_z(z)

## Paint-order tiebreak for entities in the same screen row (same world y).
## Higher z paints later (on top of) lower z. Set as the EntityNode's `z_index`.
## Note: this only affects ordering within the same y row — across rows, Y-sort
## (driven by position.y) takes precedence and is what the doc means by
## "higher-z entities are drawn later" in the *general* case where the higher-z
## entity would also overlap into the southern row.
static func z_index_for(z: int) -> int:
	return z
