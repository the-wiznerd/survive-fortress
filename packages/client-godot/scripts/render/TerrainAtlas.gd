class_name TerrainAtlas
extends RefCounted

## Bakes a procedural Image of all terrain edge variants once at startup, then
## hands out AtlasTextures pointing into it. Mirrors the canvas TerrainAtlas;
## one-time bake is cheap and lets each terrain face be a single Sprite2D draw
## (vs. ~10 ColorRects per tile).
##
## Layout: one row per registered terrain type, 17 columns:
##   cols 0..7  → 8 top-face variants (index = N*4 + E*2 + W)
##   cols 8..15 → 8 front-face variants (index = S*4 + E*2 + W)
##   col 16     → unknown-top variant
## Row pixel height = ATLAS_ROW_H (12). Top faces use the full row, front
## faces only the upper FRONT_FACE_H (10) pixels.

# index = N*4 + E*2 + W  →  [n, e, w]
const TOP_EDGE_COMBOS: Array = [
	[0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1],
	[1, 0, 0], [1, 0, 1], [1, 1, 0], [1, 1, 1],
]
# index = S*4 + E*2 + W  →  [s, e, w]
const FRONT_EDGE_COMBOS: Array = [
	[0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1],
	[1, 0, 0], [1, 0, 1], [1, 1, 0], [1, 1, 1],
]

const _ATLAS_COLS: int = 17
const _UNKNOWN_TOP_COL: int = 16

var _texture: ImageTexture = null
# terrain name (String) -> row index (int) in the atlas
var _row_for: Dictionary = {}

## Build the atlas from a list of (name, painter) pairs. Names must match the
## server-side entity type_name (lowercase) for the corresponding terrain.
## Pass overlay-only painters (e.g. "grass") here too — the consuming entity
## node decides whether to draw them.
static func build(entries: Array) -> TerrainAtlas:
	var atlas: TerrainAtlas = TerrainAtlas.new()
	atlas._bake(entries)
	return atlas

func _bake(entries: Array) -> void:
	var rows: int = entries.size()
	var img_w: int = _ATLAS_COLS * Constants.TILE_W
	var img_h: int = rows * Constants.ATLAS_ROW_H
	var image: Image = Image.create_empty(img_w, img_h, false, Image.FORMAT_RGBA8)
	image.fill(Color(0, 0, 0, 0))

	for row in range(rows):
		var entry: Dictionary = entries[row] as Dictionary
		var name: String = entry["name"] as String
		var painter: TerrainPainter = entry["painter"] as TerrainPainter
		_row_for[name] = row
		var base_y: int = row * Constants.ATLAS_ROW_H

		# 8 top-face variants.
		for combo_idx in range(TOP_EDGE_COMBOS.size()):
			var combo: Array = TOP_EDGE_COMBOS[combo_idx] as Array
			_compose_top(image, painter, combo_idx * Constants.TILE_W, base_y,
				SdkUtil.to_int(combo[0]), SdkUtil.to_int(combo[1]), SdkUtil.to_int(combo[2]))

		# 8 front-face variants (cols 8..15).
		for combo_idx in range(FRONT_EDGE_COMBOS.size()):
			var combo: Array = FRONT_EDGE_COMBOS[combo_idx] as Array
			_compose_front(image, painter, (8 + combo_idx) * Constants.TILE_W, base_y,
				SdkUtil.to_int(combo[0]), SdkUtil.to_int(combo[1]), SdkUtil.to_int(combo[2]))

		# 1 unknown-top variant (col 16).
		painter.paint_unknown_top(image, _UNKNOWN_TOP_COL * Constants.TILE_W, base_y)

	_texture = ImageTexture.create_from_image(image)

func _compose_top(image: Image, painter: TerrainPainter, x: int, y: int,
		n: int, e: int, w: int) -> void:
	painter.paint_top(image, x, y)
	if n == 1:
		image.fill_rect(Rect2i(x, y, Constants.TILE_W, 1), painter.top_edge_color)
	if w == 1:
		image.fill_rect(Rect2i(x, y, 1, Constants.TOP_FACE_H), painter.top_edge_color)
	if e == 1:
		image.fill_rect(Rect2i(x + Constants.TILE_W - 1, y, 1, Constants.TOP_FACE_H),
			painter.top_edge_color)
	# Corner cutouts where two edges meet — match canvas destination-out behavior.
	if n == 1 and w == 1:
		image.set_pixel(x, y, Color(0, 0, 0, 0))
	if n == 1 and e == 1:
		image.set_pixel(x + Constants.TILE_W - 1, y, Color(0, 0, 0, 0))

func _compose_front(image: Image, painter: TerrainPainter, x: int, y: int,
		s: int, e: int, w: int) -> void:
	painter.paint_front(image, x, y)
	if s == 1:
		image.fill_rect(Rect2i(x, y + Constants.FRONT_FACE_H - 1, Constants.TILE_W, 1),
			painter.front_edge_color)
	if w == 1:
		image.fill_rect(Rect2i(x, y, 1, Constants.FRONT_FACE_H), painter.front_edge_color)
	if e == 1:
		image.fill_rect(Rect2i(x + Constants.TILE_W - 1, y, 1, Constants.FRONT_FACE_H),
			painter.front_edge_color)
	if s == 1 and w == 1:
		image.set_pixel(x, y + Constants.FRONT_FACE_H - 1, Color(0, 0, 0, 0))
	if s == 1 and e == 1:
		image.set_pixel(x + Constants.TILE_W - 1, y + Constants.FRONT_FACE_H - 1,
			Color(0, 0, 0, 0))

# --- Region lookup ---

## AtlasTexture for a top-face variant. Edge flags are 0/1.
func top_region(name: String, n: int, e: int, w: int) -> AtlasTexture:
	var row: int = _row_for[name] as int
	var col: int = n * 4 + e * 2 + w
	return _make_region(col, row, Constants.TILE_W, Constants.TOP_FACE_H)

## AtlasTexture for a front-face variant. Edge flags are 0/1.
func front_region(name: String, s: int, e: int, w: int) -> AtlasTexture:
	var row: int = _row_for[name] as int
	var col: int = 8 + s * 4 + e * 2 + w
	return _make_region(col, row, Constants.TILE_W, Constants.FRONT_FACE_H)

## AtlasTexture for the unknown-top variant of `name`.
func unknown_top_region(name: String) -> AtlasTexture:
	var row: int = _row_for[name] as int
	return _make_region(_UNKNOWN_TOP_COL, row, Constants.TILE_W, Constants.TOP_FACE_H)

func _make_region(col: int, row: int, w: int, h: int) -> AtlasTexture:
	var atlas_tex: AtlasTexture = AtlasTexture.new()
	atlas_tex.atlas = _texture
	atlas_tex.region = Rect2(
		col * Constants.TILE_W,
		row * Constants.ATLAS_ROW_H,
		w,
		h,
	)
	return atlas_tex

## Default registration list: dirt, grass (overlay), sand, stone, water.
static func default_entries() -> Array:
	return [
		{"name": "dirt", "painter": DirtPainter.new()},
		{"name": "grass", "painter": GrassPainter.new()},
		{"name": "sand", "painter": SandPainter.new()},
		{"name": "stone", "painter": StonePainter.new()},
		{"name": "water", "painter": WaterPainter.new()},
	]
