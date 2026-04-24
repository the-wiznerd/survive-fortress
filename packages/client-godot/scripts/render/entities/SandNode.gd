class_name SandNode
extends EntityNode

## Placeholder sand tile.

const TOP: Color = Color("#e0dc81") # lightestGreen (matches canvas placeholder)
const FRONT: Color = Color("#c7c965") # lightGreen

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
