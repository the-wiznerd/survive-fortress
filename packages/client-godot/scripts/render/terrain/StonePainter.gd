class_name StonePainter
extends TerrainPainter

## Ports StoneRenderer.terrainDefs.stone from packages/rendering.

const _LIGHTEST_GRAY: Color = Color("#c0c1aa")
const _LIGHT_GRAY: Color = Color("#a7ad9a")
const _GRAY: Color = Color("#8c978a")

func _init() -> void:
	top_edge_color = _LIGHTEST_GRAY
	front_edge_color = _GRAY

func paint_top(image: Image, x: int, y: int) -> void:
	image.fill_rect(Rect2i(x, y, Constants.TILE_W, Constants.TOP_FACE_H), _LIGHTEST_GRAY)
	image.set_pixel(x + 5, y + 11, _LIGHT_GRAY)
	image.set_pixel(x + 6, y + 10, _LIGHT_GRAY)
	image.set_pixel(x + 10, y + 2, _LIGHT_GRAY)

func paint_front(image: Image, x: int, y: int) -> void:
	image.fill_rect(Rect2i(x, y, Constants.TILE_W, Constants.FRONT_FACE_H), _LIGHT_GRAY)
	image.set_pixel(x + 2, y + 9, _GRAY)
	image.set_pixel(x + 3, y + 8, _GRAY)
	image.set_pixel(x + 5, y + 0, _GRAY)
	image.set_pixel(x + 11, y + 3, _GRAY)
	image.set_pixel(x + 11, y + 4, _GRAY)
	image.set_pixel(x + 12, y + 5, _GRAY)
	image.set_pixel(x + 12, y + 6, _GRAY)

func paint_unknown_top(image: Image, x: int, y: int) -> void:
	image.fill_rect(Rect2i(x, y, Constants.TILE_W, Constants.TOP_FACE_H), _GRAY)
