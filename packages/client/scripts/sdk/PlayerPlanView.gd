class_name PlayerPlanView
extends RefCounted

## Mirrors `PlayerPlanView` in packages/server/src/sdk/types.ts.
## Per-frame snapshot of the player's plan progress.

var actions: Array[PlayerAction] = []
## Index of the next action to consume. >= actions.size() ⇒ exhausted/terminated.
var index: int = 0
## True if the plan was aborted by an invalid action this round.
var terminated: bool = false

static func from_dict(d: Dictionary) -> PlayerPlanView:
	var p: PlayerPlanView = PlayerPlanView.new()
	var raw_actions: Array = SdkUtil.to_array(d.get("actions", []))
	for raw: Variant in raw_actions:
		if raw is Dictionary:
			var action_dict: Dictionary = raw
			p.actions.append(PlayerAction.from_dict(action_dict))
	p.index = SdkUtil.to_int(d.get("index", 0))
	p.terminated = SdkUtil.to_bool(d.get("terminated", false))
	return p
