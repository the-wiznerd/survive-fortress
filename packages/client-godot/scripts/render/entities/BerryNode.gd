class_name BerryNode
extends EntityNode

## Berries normally live inside containers and aren't drawn standalone, but
## handle the "dropped on ground" case with a small placeholder square.

const SIZE_PX: int = 6
const COLOR: Color = Color("#af5550")

func setup(_sheet: SpriteSheet) -> void:
	var rect: ColorRect = ColorRect.new()
	rect.color = COLOR
	rect.size = Vector2(SIZE_PX, SIZE_PX)
	# Sit on the bottom of the front face, horizontally centered.
	rect.position = Vector2(
		(Constants.TILE_W - SIZE_PX) / 2,
		Constants.TOP_FACE_H + Constants.FRONT_FACE_H - SIZE_PX,
	)
	visual.add_child(rect)
