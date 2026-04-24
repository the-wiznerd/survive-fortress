class_name SpriteSheet
extends RefCounted

## Loads the shared sprite atlas and hands out AtlasTexture regions by cell
## coordinates. Mirrors the (col, row, w, h) addressing used by the canvas
## renderer's DrawContext.draw().
##
## Sheet grid is TILE_W wide × SPRITE_H tall per cell.

const SHEET_PATH: String = "res://assets/sprites/sprites.png"

var _texture: Texture2D = null

func _init() -> void:
	_texture = load(SHEET_PATH)
	if _texture == null:
		push_error("SpriteSheet: failed to load %s" % SHEET_PATH)

## Build an AtlasTexture for the cell rectangle (col, row, width, height) in
## sheet coordinates. Width/height are in cells, not pixels.
func region(col: int, row: int, w: int = 1, h: int = 1) -> AtlasTexture:
	var atlas: AtlasTexture = AtlasTexture.new()
	atlas.atlas = _texture
	atlas.region = Rect2(
		col * Constants.TILE_W,
		row * Constants.SPRITE_H,
		w * Constants.TILE_W,
		h * Constants.SPRITE_H,
	)
	return atlas
