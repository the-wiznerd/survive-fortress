class_name SandPainter
extends TerrainPainter

## Ports SandRenderer.terrainDefs.sand from packages/rendering.

const _LIGHTEST_GREEN: Color = Color("#e0dc81")
const _LIGHT_GREEN: Color = Color("#c7c965")
const _LIGHT_YELLOW: Color = Color("#c5a45f")

func _init() -> void:
	top_edge_color = _LIGHT_GREEN
	front_edge_color = _LIGHT_YELLOW

func paint_top(image: Image, x: int, y: int) -> void:
	image.fill_rect(Rect2i(x, y, Constants.TILE_W, Constants.TOP_FACE_H), _LIGHTEST_GREEN)
	image.set_pixel(x + 5, y + 3, _LIGHT_GREEN)
	image.set_pixel(x + 14, y + 1, _LIGHT_GREEN)
	image.set_pixel(x + 10, y + 8, _LIGHT_GREEN)

func paint_front(image: Image, x: int, y: int) -> void:
	image.fill_rect(Rect2i(x, y, Constants.TILE_W, Constants.FRONT_FACE_H), _LIGHT_GREEN)
	image.set_pixel(x + 4, y + 8, _LIGHT_YELLOW)
	image.set_pixel(x + 11, y + 4, _LIGHT_YELLOW)

func paint_unknown_top(image: Image, x: int, y: int) -> void:
	image.fill_rect(Rect2i(x, y, Constants.TILE_W, Constants.TOP_FACE_H), _LIGHT_YELLOW)
