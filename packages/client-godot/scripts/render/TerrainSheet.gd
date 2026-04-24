class_name TerrainSheet
extends RefCounted

## Hand-drawn terrain tiles served from the shared sprite sheet. All terrain
## strips live on rows 0 (top faces) and 1 (front faces); each terrain
## occupies an 8-cell-wide column block on those two rows. Water animation
## frames continue along the same two rows after the static terrains.
##
## Authoring layout (left → right within each strip):
##   col 0: flat   col 1: E      col 2: EW     col 3: W
##   col 4: NW/SW  col 5: NEW/SEW col 6: NE/SE col 7: N/S
## Labels mark sides that have NO same-z neighbor (i.e. the cliff edge to draw
## a border on). "flat" = surrounded; "NEW" or "SEW" = isolated tile.

const _TOP_ROW: int = 0
const _FRONT_ROW: int = 1
const _STRIP_COLS: int = 8

## Map from variant index (N*4 + E*2 + W for top, S*4 + E*2 + W for front) to
## the column offset within an 8-cell strip.
const _COL_FOR_INDEX: Array[int] = [
	0, # 0 = flat
	3, # 1 = W
	1, # 2 = E
	2, # 3 = EW
	7, # 4 = N (or S)
	4, # 5 = NW (or SW)
	6, # 6 = NE (or SE)
	5, # 7 = NEW (or SEW)
]

## Terrain name (matches server entity type_name) → starting column of the
## terrain's 8-cell strip on rows 0/1.
const _BASE_COL: Dictionary = {
	"dirt": 0, # cols 0..7
	"grass": 8, # cols 8..15
	"sand": 16, # cols 16..23
	"stone": 24, # cols 24..31
}

## Water animation. Frames are stacked vertically in cols 0..7, starting at
## row 2: frame N's top row is (_WATER_BASE_ROW + N * 2) and its front row is
## one below that. This makes it easier to author the animation by seeing the
## frames lined up vertically.
const WATER_FRAME_COUNT: int = 4
const _WATER_BASE_COL: int = 0 # cols 0..7
const _WATER_BASE_ROW: int = 2 # frame 0: rows 2 (top) + 3 (front)

var _texture: Texture2D = null

func _init() -> void:
	_texture = load(SpriteSheet.SHEET_PATH)
	if _texture == null:
		push_error("TerrainSheet: failed to load %s" % SpriteSheet.SHEET_PATH)

## True if `name` has a strip allocated in the sheet.
func has_terrain(name: String) -> bool:
	return _BASE_COL.has(name)

func top_region(name: String, n: int, e: int, w: int) -> AtlasTexture:
	var col: int = (_BASE_COL[name] as int) + _COL_FOR_INDEX[n * 4 + e * 2 + w]
	return _make_region(col, _TOP_ROW, Constants.TOP_FACE_H)

func front_region(name: String, s: int, e: int, w: int) -> AtlasTexture:
	var col: int = (_BASE_COL[name] as int) + _COL_FOR_INDEX[s * 4 + e * 2 + w]
	return _make_region(col, _FRONT_ROW, Constants.FRONT_FACE_H)

## Top-face region for the given water animation frame.
func water_top_region(frame: int, n: int, e: int, w: int) -> AtlasTexture:
	var row: int = _WATER_BASE_ROW + (frame % WATER_FRAME_COUNT) * 2
	var col: int = _WATER_BASE_COL + _COL_FOR_INDEX[n * 4 + e * 2 + w]
	return _make_region(col, row, Constants.TOP_FACE_H)

## Front-face region for the given water animation frame.
func water_front_region(frame: int, s: int, e: int, w: int) -> AtlasTexture:
	var row: int = _WATER_BASE_ROW + (frame % WATER_FRAME_COUNT) * 2 + 1
	var col: int = _WATER_BASE_COL + _COL_FOR_INDEX[s * 4 + e * 2 + w]
	return _make_region(col, row, Constants.FRONT_FACE_H)

func _make_region(col: int, row: int, h: int) -> AtlasTexture:
	var atlas: AtlasTexture = AtlasTexture.new()
	atlas.atlas = _texture
	atlas.region = Rect2(
		col * Constants.TILE_W,
		row * Constants.SPRITE_H,
		Constants.TILE_W,
		h,
	)
	return atlas
