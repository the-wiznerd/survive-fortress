class_name ServerMessage
extends RefCounted

## Mirrors `ServerMessage` (the union of server→client messages) in
## packages/server/src/sdk/types.ts. GDScript has no real unions, so this
## class holds the fields for every variant; check `type` first.

const TYPE_JOINED: String = "joined"
const TYPE_ROUND_RESOLVE: String = "round-resolve"
const TYPE_ERROR: String = "error"

var type: String = ""

# joined --------------------------------------------------------------------
var view: GameView = null
var action_points_per_round: int = 0
## Map of action type (String) → AP cost (int).
var action_costs: Dictionary = {}
var turn_mode: String = ""

# round-resolve -------------------------------------------------------------
var frames: Array[GameView] = []

# error ---------------------------------------------------------------------
var error_message: String = ""

static func from_dict(d: Dictionary) -> ServerMessage:
	var msg: ServerMessage = ServerMessage.new()
	msg.type = SdkUtil.to_string_or(d.get("type", ""))
	match msg.type:
		TYPE_JOINED:
			msg.view = GameView.from_dict(SdkUtil.to_dict(d.get("view", {})))
			msg.action_points_per_round = SdkUtil.to_int(d.get("actionPointsPerRound", 0))
			msg.action_costs = SdkUtil.to_dict(d.get("actionCosts", {}))
			msg.turn_mode = SdkUtil.to_string_or(d.get("turnMode", ""))
		TYPE_ROUND_RESOLVE:
			var raw_frames: Array = SdkUtil.to_array(d.get("frames", []))
			for raw: Variant in raw_frames:
				if raw is Dictionary:
					var frame_dict: Dictionary = raw
					msg.frames.append(GameView.from_dict(frame_dict))
		TYPE_ERROR:
			msg.error_message = SdkUtil.to_string_or(d.get("message", ""))
		_:
			push_warning("ServerMessage.from_dict(): unknown type '%s'" % msg.type)
	return msg
