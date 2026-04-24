class_name DirtNode
extends EntityNode

## Placeholder dirt tile: top + front face as flat rectangles. If the entity's
## groundCover trait reports cover=='grass', the top face is recolored green.
## Real pixel-art tiles + edge selection arrive in a later phase.

const TOP_DIRT: Color = Color("#c5a45f") # lightYellow
const TOP_GRASS: Color = Color("#a2af50") # green
const FRONT: Color = Color("#a7814e") # yellow

var _top: ColorRect = null
var _front: ColorRect = null

func setup(_sheet: SpriteSheet) -> void:
	_top = ColorRect.new()
	_top.size = Vector2(Constants.TILE_W, Constants.TOP_FACE_H)
	_top.position = Vector2.ZERO
	visual.add_child(_top)

	_front = ColorRect.new()
	_front.color = FRONT
	_front.size = Vector2(Constants.TILE_W, Constants.FRONT_FACE_H)
	_front.position = Vector2(0, Constants.TOP_FACE_H)
	visual.add_child(_front)

func push_state(entity: ViewEntity) -> void:
	super.push_state(entity)
	var ground_cover: Dictionary = entity.get_trait("groundCover")
	var has_grass: bool = SdkUtil.to_string_or(ground_cover.get("cover", "")) == "grass"
	_top.color = TOP_GRASS if has_grass else TOP_DIRT
