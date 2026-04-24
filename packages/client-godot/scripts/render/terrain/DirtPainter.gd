class_name DirtPainter
extends TerrainPainter

## Ports DirtRenderer.terrainDefs.dirt from packages/rendering.

const _LIGHT_YELLOW: Color = Color("#c5a45f")
const _YELLOW: Color = Color("#a7814e")
const _DARK_YELLOW: Color = Color("#7f5845")

func _init() -> void:
	top_edge_color = _YELLOW
	front_edge_color = _DARK_YELLOW

func paint_top(image: Image, x: int, y: int) -> void:
	image.fill_rect(Rect2i(x, y, Constants.TILE_W, Constants.TOP_FACE_H), _LIGHT_YELLOW)
	image.set_pixel(x + 5, y + 3, _YELLOW)
	image.set_pixel(x + 14, y + 1, _YELLOW)
	image.set_pixel(x + 10, y + 8, _YELLOW)

func paint_front(image: Image, x: int, y: int) -> void:
	image.fill_rect(Rect2i(x, y, Constants.TILE_W, Constants.FRONT_FACE_H), _YELLOW)
	image.set_pixel(x + 4, y + 8, _DARK_YELLOW)
	image.set_pixel(x + 11, y + 4, _DARK_YELLOW)

func paint_unknown_top(image: Image, x: int, y: int) -> void:
	image.fill_rect(Rect2i(x, y, Constants.TILE_W, Constants.TOP_FACE_H), _DARK_YELLOW)
