class_name PlayerAction
extends RefCounted

## Mirrors `PlayerAction` in packages/server/src/sdk/types.ts.
## Discriminated union over `type`. Unused fields are left at their defaults.

const TYPE_MOVE: String = "move"
const TYPE_WAIT: String = "wait"
const TYPE_HARVEST: String = "harvest"
const TYPE_PICKUP: String = "pickup"
const TYPE_DROP: String = "drop"
const TYPE_EAT: String = "eat"

var type: String = ""
## For TYPE_MOVE: one of "north" | "south" | "east" | "west" | etc. (Direction).
var direction: String = ""
## For harvest/pickup/drop/eat.
var target_id: int = 0
## For TYPE_DROP: tile delta from the player.
var dx: int = 0
var dy: int = 0

static func move(dir: String) -> PlayerAction:
	var a: PlayerAction = PlayerAction.new()
	a.type = TYPE_MOVE
	a.direction = dir
	return a

static func wait() -> PlayerAction:
	var a: PlayerAction = PlayerAction.new()
	a.type = TYPE_WAIT
	return a

static func harvest(target: int) -> PlayerAction:
	var a: PlayerAction = PlayerAction.new()
	a.type = TYPE_HARVEST
	a.target_id = target
	return a

static func pickup(target: int) -> PlayerAction:
	var a: PlayerAction = PlayerAction.new()
	a.type = TYPE_PICKUP
	a.target_id = target
	return a

static func drop(target: int, delta_x: int, delta_y: int) -> PlayerAction:
	var a: PlayerAction = PlayerAction.new()
	a.type = TYPE_DROP
	a.target_id = target
	a.dx = delta_x
	a.dy = delta_y
	return a

static func eat(target: int) -> PlayerAction:
	var a: PlayerAction = PlayerAction.new()
	a.type = TYPE_EAT
	a.target_id = target
	return a

static func from_dict(d: Dictionary) -> PlayerAction:
	var a: PlayerAction = PlayerAction.new()
	a.type = SdkUtil.to_string_or(d.get("type", ""))
	a.direction = SdkUtil.to_string_or(d.get("direction", ""))
	a.target_id = SdkUtil.to_int(d.get("targetId", 0))
	a.dx = SdkUtil.to_int(d.get("dx", 0))
	a.dy = SdkUtil.to_int(d.get("dy", 0))
	return a

func to_dict() -> Dictionary:
	match type:
		TYPE_MOVE:
			return {"type": type, "direction": direction}
		TYPE_WAIT:
			return {"type": type}
		TYPE_HARVEST, TYPE_PICKUP, TYPE_EAT:
			return {"type": type, "targetId": target_id}
		TYPE_DROP:
			return {"type": type, "targetId": target_id, "dx": dx, "dy": dy}
		_:
			push_error("PlayerAction.to_dict(): unknown type %s" % type)
			return {"type": type}
