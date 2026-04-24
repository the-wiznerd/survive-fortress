class_name GameView
extends RefCounted

## Mirrors `SerializedGameView` (the wire form of `GameView`) in
## packages/server/src/sdk/types.ts. `visiblePositions` arrives as a string[]
## of "x,y,z" keys; we keep it as a Dictionary set for O(1) lookups.

var tick: int = 0
var player_id: String = ""
var entities: Array[ViewEntity] = []
## Set of "x,y,z" keys the player can see, stored as Dictionary[String, bool=true]
## for O(1) membership testing.
var visible_positions: Dictionary = {}
var player_plan: PlayerPlanView = PlayerPlanView.new()

static func from_dict(d: Dictionary) -> GameView:
	var v: GameView = GameView.new()
	v.tick = SdkUtil.to_int(d.get("tick", 0))
	v.player_id = SdkUtil.to_string_or(d.get("playerId", ""))

	var raw_entities: Array = SdkUtil.to_array(d.get("entities", []))
	for raw: Variant in raw_entities:
		if raw is Dictionary:
			var entity_dict: Dictionary = raw
			v.entities.append(ViewEntity.from_dict(entity_dict))

	var raw_positions: Array = SdkUtil.to_array(d.get("visiblePositions", []))
	for key: Variant in raw_positions:
		if key is String:
			v.visible_positions[key] = true

	v.player_plan = PlayerPlanView.from_dict(SdkUtil.to_dict(d.get("playerPlan", {})))
	return v

func is_visible(x: int, y: int, z: int) -> bool:
	return visible_positions.has("%d,%d,%d" % [x, y, z])
