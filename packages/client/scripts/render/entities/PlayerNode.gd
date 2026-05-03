class_name PlayerNode
extends EntityNode

## Player avatar. Sprite is 1 cell wide × 3 cells tall and anchors its bottom
## at the bottom of the tile's front face, so it visually stands on the tile.

const SPRITE_COL: int = 0
const SPRITE_ROW: int = 11
const SPRITE_H_CELLS: int = 3

var _sprite: Sprite2D = null

func setup(resources: RenderResources) -> void:
	_sprite = Sprite2D.new()
	_sprite.texture = resources.sheet.region(SPRITE_COL, SPRITE_ROW, 1, SPRITE_H_CELLS)
	_sprite.centered = false
	_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	# Anchor the sprite's bottom at the bottom of the tile's front face.
	var sprite_h_px: int = SPRITE_H_CELLS * Constants.SPRITE_H
	_sprite.position = Vector2(0, Constants.TOP_FACE_H + Constants.FRONT_FACE_H - sprite_h_px)
	visual.add_child(_sprite)
