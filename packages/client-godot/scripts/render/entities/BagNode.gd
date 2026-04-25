class_name BagNode
extends EntityNode

## Bags normally live in equipment slots; this placeholder covers the case
## where one is dropped on the ground.

const SIZE_PX: int = 10
const COLOR: Color = Color("#7f5845")

func setup(_resources: RenderResources) -> void:
	var rect: ColorRect = ColorRect.new()
	rect.color = COLOR
	rect.size = Vector2(SIZE_PX, SIZE_PX)
	rect.position = Vector2(
		Utils.divi(Constants.TILE_W - SIZE_PX, 2),
		Constants.TOP_FACE_H + Constants.FRONT_FACE_H - SIZE_PX,
	)
	visual.add_child(rect)
