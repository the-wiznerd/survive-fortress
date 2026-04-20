/** Width of a tile in pixels (shared by all cell types). */
export const TILE_W = 16
/** Height of a non-terrain sprite cell in the sprite sheet. */
export const SPRITE_H = 11
/** Height of a terrain top face and the grid row step. */
export const TOP_FACE_H = 12
/** Height of a terrain front (side) face. */
export const FRONT_FACE_H = 10
/** Atlas row height — tall enough for either face type. */
export const ATLAS_ROW_H = Math.max(TOP_FACE_H, FRONT_FACE_H)
