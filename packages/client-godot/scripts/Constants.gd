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
