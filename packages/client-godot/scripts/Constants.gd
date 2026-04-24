class_name Constants
extends Object

## Mirrors packages/rendering/src/constants.ts.
## Pseudo-isometric pixel projection: an entity at world (x, y, z) renders at
## screen position (x * TILE_W, y * TOP_FACE_H - z * FRONT_FACE_H).

## Width of a tile in pixels (shared by all cell types).
const TILE_W: int = 16
## Height of a non-terrain sprite cell in the sprite sheet.
const SPRITE_H: int = 12
## Height of a terrain top face and the grid row step.
const TOP_FACE_H: int = 12
## Height of a terrain front (side) face.
const FRONT_FACE_H: int = 10

## Project a world position to screen pixels.
static func project(x: int, y: int, z: int) -> Vector2:
	return Vector2(x * TILE_W, y * TOP_FACE_H - z * FRONT_FACE_H)

## Y-sort key for a world position. Higher key paints later (in front).
## Tiles further south (larger y) and lower (smaller z) paint last.
static func y_sort_key(y: int, z: int) -> float:
	return float(y * TOP_FACE_H - z * FRONT_FACE_H)
