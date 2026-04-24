class_name BushNode
extends EntityNode

## Bush. Picks one of four sprite columns based on the entity's `size` trait
## (small/large) and whether its `harvestable.available` is true (has berries).
## Updates the texture region whenever push_state changes those values.

const SPRITE_ROW: int = 12
const SPRITE_H_CELLS: int = 2

const COL_LARGE: int = 1
const COL_LARGE_BERRIES: int = 2
const COL_SMALL: int = 3
const COL_SMALL_BERRIES: int = 4

var _sprite: Sprite2D = null
var _sheet: SpriteSheet = null
var _last_col: int = -1

func setup(sheet: SpriteSheet) -> void:
	_sheet = sheet
	_sprite = Sprite2D.new()
	_sprite.centered = false
	_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	var sprite_h_px: int = SPRITE_H_CELLS * Constants.SPRITE_H
	_sprite.position = Vector2(0, Constants.TOP_FACE_H + Constants.FRONT_FACE_H - sprite_h_px)
	add_child(_sprite)

func push_state(entity: ViewEntity) -> void:
	super.push_state(entity)
	var col: int = _select_column(entity)
	if col != _last_col:
		_sprite.texture = _sheet.region(col, SPRITE_ROW, 1, SPRITE_H_CELLS)
		_last_col = col

func _select_column(entity: ViewEntity) -> int:
	# `size` is a bare string trait ("small" | "large"); `harvestable` is a dict.
	var is_small: bool = SdkUtil.to_string_or(entity.traits.get("size", "")) == "small"
	var harvestable: Dictionary = entity.get_trait("harvestable")
	var has_berries: bool = SdkUtil.to_bool(harvestable.get("available", false))
	if is_small:
		return COL_SMALL_BERRIES if has_berries else COL_SMALL
	return COL_LARGE_BERRIES if has_berries else COL_LARGE
