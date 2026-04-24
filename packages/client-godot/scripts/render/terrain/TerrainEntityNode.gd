class_name TerrainEntityNode
extends EntityNode

## Base class for the terrain EntityNodes (Dirt, Sand, Stone). Maintains two
## Sprite2Ds — one for the top face, one for the front face — and on each
## push_state looks up the right hand-drawn variant from the terrain sheet
## using neighbor masks from the WorldIndex. The front face is hidden when
## occluded by a same-z southern neighbor.
##
## Subclasses override _terrain_name() to identify which sheet rows to use
## (e.g. "dirt", "sand", "stone"). Subclasses needing additional faces (e.g.
## DirtNode's grass overlay) extend setup() and push_state().

var _sheet: TerrainSheet = null
var _top: Sprite2D = null
var _front: Sprite2D = null

## Subclass MUST override to return the lowercase terrain name registered
## with the TerrainSheet (matches server entity type_name for plain terrain).
func _terrain_name() -> String:
	return ""

func setup(resources: RenderResources) -> void:
	_sheet = resources.terrain_sheet
	_top = _make_face_sprite(0)
	_front = _make_face_sprite(Constants.TOP_FACE_H)

## Helper used by this class and subclasses (e.g. DirtNode for the grass
## overlay) to spawn a face Sprite2D anchored to the tile's local origin.
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
	# Non-water terrain treats water as empty for neighbor checks, so a stone
	# tile next to water still draws its cliff border on the water-facing side.
	var name: String = _terrain_name()
	var n: int = world.top_edge_north_solid(entity.x, entity.y, entity.z)
	var e: int = world.top_edge_east_solid(entity.x, entity.y, entity.z)
	var w: int = world.top_edge_west_solid(entity.x, entity.y, entity.z)
	_top.texture = _sheet.top_region(name, n, e, w)
	var occluded: bool = world.front_occluded_solid(entity.x, entity.y, entity.z)
	_front.visible = not occluded
	if not occluded:
		var s_flag: int = world.front_edge_south_solid(entity.x, entity.y, entity.z)
		var fe: int = world.front_edge_east_solid(entity.x, entity.y, entity.z)
		var fw: int = world.front_edge_west_solid(entity.x, entity.y, entity.z)
		_front.texture = _sheet.front_region(name, s_flag, fe, fw)
