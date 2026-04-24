class_name TerrainEntityNode
extends EntityNode

## Base class for the four terrain EntityNodes (Dirt, Sand, Stone, Water).
## Maintains two Sprite2Ds — one for the top face, one for the front face —
## and on each push_state looks up the right atlas variant from neighbor info
## carried in the WorldIndex. The front face is hidden when occluded by a
## same-z southern neighbor.
##
## Subclasses override _terrain_name() to identify which atlas variant to use
## (e.g. "dirt", "sand", "stone", "water"). Subclasses needing additional
## faces (e.g. DirtNode's grass overlay) extend setup() and push_state().

var _atlas: TerrainAtlas = null
var _top: Sprite2D = null
var _front: Sprite2D = null

## Subclass MUST override to return the lowercase terrain name registered
## with the TerrainAtlas (matches server entity type_name for plain terrain).
func _terrain_name() -> String:
	return ""

func setup(resources: RenderResources) -> void:
	_atlas = resources.terrain_atlas
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
	if world == null or _atlas == null:
		return
	var n: int = world.top_edge_north(entity.x, entity.y, entity.z)
	var e: int = world.top_edge_east(entity.x, entity.y, entity.z)
	var w: int = world.top_edge_west(entity.x, entity.y, entity.z)
	var s_flag: int = world.front_edge_south(entity.x, entity.y, entity.z)
	var fe: int = world.front_edge_east(entity.x, entity.y, entity.z)
	var fw: int = world.front_edge_west(entity.x, entity.y, entity.z)
	var occluded: bool = world.front_occluded(entity.x, entity.y, entity.z)
	var name: String = _terrain_name()
	_top.texture = _atlas.top_region(name, n, e, w)
	_front.visible = not occluded
	if not occluded:
		_front.texture = _atlas.front_region(name, s_flag, fe, fw)
