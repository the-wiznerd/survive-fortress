class_name GrassPainter
extends TerrainPainter

## Ports DirtRenderer.terrainDefs.grass from packages/rendering. Drawn as an
## overlay on top of dirt — the front face explicitly stacks the dirt base
## with a 2px grass strip on top.

const _GREEN: Color = Color("#a2af50")
const _LIGHT_GREEN: Color = Color("#c7c965")
const _DARK_GREEN: Color = Color("#627c4e")
const _YELLOW: Color = Color("#a7814e")
const _DARK_YELLOW: Color = Color("#7f5845")

func _init() -> void:
	top_edge_color = _DARK_GREEN
	front_edge_color = _DARK_YELLOW

func paint_top(image: Image, x: int, y: int) -> void:
	image.fill_rect(Rect2i(x, y, Constants.TILE_W, Constants.TOP_FACE_H), _GREEN)
	image.set_pixel(x + 5, y + 3, _LIGHT_GREEN)
	image.set_pixel(x + 14, y + 1, _LIGHT_GREEN)
	image.set_pixel(x + 10, y + 8, _LIGHT_GREEN)

func paint_front(image: Image, x: int, y: int) -> void:
	# Dirt base.
	image.fill_rect(Rect2i(x, y, Constants.TILE_W, Constants.FRONT_FACE_H), _YELLOW)
	image.set_pixel(x + 4, y + 8, _DARK_YELLOW)
	image.set_pixel(x + 11, y + 4, _DARK_YELLOW)
	# Grass strip: row 1 darkYellow (canvas does this; effectively underline),
	# row 0 darkGreen with a few green highlights.
	image.fill_rect(Rect2i(x, y + 1, Constants.TILE_W, 1), _DARK_YELLOW)
	image.fill_rect(Rect2i(x, y, Constants.TILE_W, 1), _DARK_GREEN)
	image.set_pixel(x + 2, y, _GREEN)
	image.set_pixel(x + 7, y, _GREEN)
	image.set_pixel(x + 10, y, _GREEN)
	image.set_pixel(x + Constants.TILE_W - 1, y, _GREEN)

func paint_unknown_top(image: Image, x: int, y: int) -> void:
	image.fill_rect(Rect2i(x, y, Constants.TILE_W, Constants.TOP_FACE_H), _DARK_GREEN)
