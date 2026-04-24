class_name WaterPainter
extends TerrainPainter

## Placeholder painter so water participates in the atlas with its own variant
## set. Real water rendering uses sprite-sheet animation frames (added in B3);
## this is here so neighbor edges work today.

const _LIGHT_BLUE: Color = Color("#76cdd1")
const _BLUE: Color = Color("#518fb0")
const _DARK_BLUE: Color = Color("#476f7a")

func _init() -> void:
	top_edge_color = _BLUE
	front_edge_color = _DARK_BLUE

func paint_top(image: Image, x: int, y: int) -> void:
	image.fill_rect(Rect2i(x, y, Constants.TILE_W, Constants.TOP_FACE_H), _LIGHT_BLUE)

func paint_front(image: Image, x: int, y: int) -> void:
	image.fill_rect(Rect2i(x, y, Constants.TILE_W, Constants.FRONT_FACE_H), _BLUE)

func paint_unknown_top(image: Image, x: int, y: int) -> void:
	image.fill_rect(Rect2i(x, y, Constants.TILE_W, Constants.TOP_FACE_H), _DARK_BLUE)
