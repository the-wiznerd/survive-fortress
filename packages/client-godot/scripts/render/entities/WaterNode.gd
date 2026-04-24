class_name WaterNode
extends EntityNode

## Placeholder water tile (no animation yet).

const TOP: Color = Color("#76cdd1") # lightBlue
const FRONT: Color = Color("#518fb0") # blue

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
