class_name StoneNode
extends EntityNode

## Placeholder stone tile.

const TOP: Color = Color("#c0c1aa") # lightestGray
const FRONT: Color = Color("#a7ad9a") # lightGray

func setup(_sheet: SpriteSheet) -> void:
	var top: ColorRect = ColorRect.new()
	top.color = TOP
	top.size = Vector2(Constants.TILE_W, Constants.TOP_FACE_H)
	add_child(top)

	var front: ColorRect = ColorRect.new()
	front.color = FRONT
	front.size = Vector2(Constants.TILE_W, Constants.FRONT_FACE_H)
	front.position = Vector2(0, Constants.TOP_FACE_H)
	add_child(front)
