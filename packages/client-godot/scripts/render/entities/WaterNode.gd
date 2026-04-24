class_name WaterNode
extends EntityNode

## Animated water tile. Uses the 4 water frame rows in the terrain sheet and
## advances through them in _process based on wall time + a per-tile phase
## offset (matches WaterRenderer.ts: frame = floor(now / interval) + wx + wy).
##
## Edge variants: water borders only against NON-water neighbors at the same z.
## Adjacent water tiles render as a flat sheet. A water cliff (no neighbor at
## the same z) draws no border on that side — water spills smoothly off the
## edge — matching the canvas behavior.

const FRAME_INTERVAL_MS: int = 250
## Pixel offset applied to both faces so water sits a touch lower than its
## surroundings (matches the canvas WaterRenderer's vertical nudge).
const WATER_Y_OFFSET: int = 2

var _sheet: TerrainSheet = null
var _top: Sprite2D = null
var _front: Sprite2D = null
## Cached neighbor masks from the most recent push_state, used so _process
## can re-fetch the texture for the new frame without recomputing edges.
var _n: int = 0
var _e: int = 0
var _w: int = 0
var _s_flag: int = 0
var _fe: int = 0
var _fw: int = 0
var _front_occluded: bool = true
## Per-tile phase offset (wx + wy) so neighboring tiles animate out of sync.
var _phase: int = 0
var _last_frame: int = -1

func setup(resources: RenderResources) -> void:
	_sheet = resources.terrain_sheet
	_top = _make_face_sprite(WATER_Y_OFFSET)
	_front = _make_face_sprite(Constants.TOP_FACE_H + WATER_Y_OFFSET)

func _make_face_sprite(y_offset: int) -> Sprite2D:
	var s: Sprite2D = Sprite2D.new()
	s.centered = false
	s.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	s.position = Vector2(0, y_offset)
	visual.add_child(s)
	return s

func push_state(entity: ViewEntity, world: WorldIndex = null) -> void:
	super.push_state(entity, world)
	if world == null or _sheet == null:
		return
	_n = _border_against_non_water(world, entity.x, entity.y - 1, entity.z)
	_e = _border_against_non_water(world, entity.x + 1, entity.y, entity.z)
	_w = _border_against_non_water(world, entity.x - 1, entity.y, entity.z)
	_s_flag = _border_against_non_water(world, entity.x, entity.y + 1, entity.z)
	_fe = _e
	_fw = _w
	_front_occluded = world.front_occluded(entity.x, entity.y, entity.z)
	_front.visible = not _front_occluded
	_phase = entity.x + entity.y
	_last_frame = -1
	_apply_frame()

func _process(_delta: float) -> void:
	_apply_frame()

func _apply_frame() -> void:
	if _sheet == null:
		return
	var ticks: int = Time.get_ticks_msec()
	var frame_idx: int = posmod(int(ticks / FRAME_INTERVAL_MS) + _phase,
		TerrainSheet.WATER_FRAME_COUNT)
	if frame_idx == _last_frame:
		return
	_last_frame = frame_idx
	_top.texture = _sheet.water_top_region(frame_idx, _n, _e, _w)
	if not _front_occluded:
		_front.texture = _sheet.water_front_region(frame_idx, _s_flag, _fe, _fw)

## 1 if the same-z neighbor at (nx, ny, z) is non-water terrain (so we should
## draw a border between us). 0 if it's water or empty (no border).
func _border_against_non_water(world: WorldIndex, nx: int, ny: int, z: int) -> int:
	var t: String = world.type_at(nx, ny, z)
	if t == "" or t == "water":
		return 0
	return 1
