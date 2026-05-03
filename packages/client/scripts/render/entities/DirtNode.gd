class_name DirtNode
extends TerrainEntityNode

## Dirt with optional grass overlay. The grass is drawn as a second pair of
## face Sprite2Ds layered on top of the dirt faces, using the same edge
## variant indices so the cuts line up with the dirt below.

var _grass_top: Sprite2D = null
var _grass_front: Sprite2D = null

func _terrain_name() -> String:
	return "dirt"

func setup(resources: RenderResources) -> void:
	super.setup(resources)
	_grass_top = _make_face_sprite(0)
	_grass_top.visible = false
	_grass_front = _make_face_sprite(Constants.TOP_FACE_H)
	_grass_front.visible = false

func push_state(entity: ViewEntity, world: WorldIndex = null) -> void:
	super.push_state(entity, world)
	if world == null or _sheet == null:
		return
	var ground_cover: Dictionary = entity.get_trait("groundCover")
	var has_grass: bool = SdkUtil.to_string_or(ground_cover.get("cover", "")) == "grass"
	_grass_top.visible = has_grass
	_grass_front.visible = has_grass and _front.visible
	if has_grass:
		var n: int = world.top_edge_north(entity.x, entity.y, entity.z)
		var e: int = world.top_edge_east(entity.x, entity.y, entity.z)
		var w: int = world.top_edge_west(entity.x, entity.y, entity.z)
		_grass_top.texture = _sheet.top_region("grass", n, e, w)
		if _front.visible:
			var s_flag: int = world.front_edge_south_solid(entity.x, entity.y, entity.z)
			var fe: int = world.front_edge_east(entity.x, entity.y, entity.z)
			var fw: int = world.front_edge_west(entity.x, entity.y, entity.z)
			_grass_front.texture = _sheet.front_region("grass", s_flag, fe, fw)
