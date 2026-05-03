class_name Utils
extends Object

## Project-wide helpers that don't fit on any one node. Kept slim — anything
## game-domain-specific belongs in its own class.

## Sort position for an entity at world (x, y). Used as the EntityNode's
## `position` so Godot's Y-sort orders entities row-by-row (north → south),
## independent of elevation. The visual z-offset is applied separately to a
## child node so it doesn't influence sort order.
static func sort_position(x: int, y: int) -> Vector2:
	return Vector2(x * Constants.TILE_W, y * Constants.TOP_FACE_H)

## Visual offset applied to an entity's child "_visual" node so its sprite is
## painted at the elevation-shifted screen position without affecting Y-sort.
static func visual_offset_for_z(z: int) -> Vector2:
	return Vector2(0, -z * Constants.FRONT_FACE_H)

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

## Truncating integer division. Same as `a / b` but documents intent and
## suppresses the integer_division warning at the single call site here, so
## you can use it everywhere without `@warning_ignore` boilerplate. Note this
## truncates toward zero (e.g. divi(-5, 2) == -2), matching GDScript's `/`.
## If you need floor semantics across negatives use `floori(float(a) / b)`.
static func divi(a: int, b: int) -> int:
	@warning_ignore("integer_division")
	return a / b

## Truncating integer modulo. Sign follows the dividend, matching `%`.
static func modi(a: int, b: int) -> int:
	@warning_ignore("integer_division")
	return a % b
