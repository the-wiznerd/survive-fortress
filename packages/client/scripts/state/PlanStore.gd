class_name PlanStore
extends Node

## Owns the player's in-progress plan for the current planning phase.
## Mirrors the slice of packages/client/src/stores/game.ts that deals with the
## plan, AP budget, and path-to-target appending.
##
## Lifecycle: created once by main.gd. Configured from the `joined` server
## message (AP per round + per-action costs). Cleared at the start of every
## planning phase (i.e. after a round resolves, until we wire submission).
##
## Emits `plan_changed` whenever the plan array is mutated. Subscribers
## (overlay renderers, HUD widgets) re-read `plan` from scratch on each
## emission \u2014 this isn't a hot path.

signal plan_changed

const PHASE_PLANNING: String = "planning"
const PHASE_SUBMITTED: String = "submitted"
const PHASE_RESOLVING: String = "resolving"

var phase: String = PHASE_PLANNING
var plan: Array[PlayerAction] = []
var action_points_per_round: int = 0
## Map of action type (String) → base AP cost (int).
var action_costs: Dictionary = {}
## Latest world view, used to look up per-target action costs (e.g. a bush's
## `harvestable.cost`). Pushed by main.gd whenever the view advances.
var _view: GameView = null

## Bind AP budget + cost table from the server's `joined` message.
func configure(ap_per_round: int, costs: Dictionary) -> void:
	action_points_per_round = ap_per_round
	action_costs = costs

## Push the latest GameView in. Used by action_cost() to resolve per-target
## costs from trait data; otherwise the store has no opinion on the view.
func set_view(view: GameView) -> void:
	_view = view

func plan_cost() -> int:
	var total: int = 0
	for a: PlayerAction in plan:
		total += action_cost(a)
	return total

func action_cost(a: PlayerAction) -> int:
	# Per-target trait costs (e.g. harvestable.cost) take priority when the
	# trait carries one. Falls back to the base table from the server's
	# `joined` message, then to 1 if neither is known.
	var override: int = _per_target_cost(a)
	if override > 0:
		return override
	return _coerce_int(action_costs.get(a.type, 1), 1)

## Look up a target-trait cost for the action, or -1 if none applies. Returns
## an int so action_cost() can distinguish "no override" from "cost is 0".
func _per_target_cost(a: PlayerAction) -> int:
	if a.target_id == 0 or _view == null:
		return -1
	var target: ViewEntity = _find_entity(a.target_id)
	if target == null:
		return -1
	match a.type:
		PlayerAction.TYPE_HARVEST:
			var h: Dictionary = target.get_trait("harvestable")
			if h.has("cost"):
				return _coerce_int(h.get("cost"), -1)
	return -1

func _find_entity(id: int) -> ViewEntity:
	for e: ViewEntity in _view.entities:
		if e.id == id:
			return e
	return null

static func _coerce_int(v: Variant, fallback: int) -> int:
	if v is int:
		var i: int = v
		return i
	if v is float:
		var f: float = v
		return int(f)
	return fallback

func can_afford(a: PlayerAction) -> bool:
	return plan_cost() + action_cost(a) <= action_points_per_round

## Drop everything in the plan. No-op if already empty.
func clear() -> void:
	if plan.is_empty():
		return
	plan.clear()
	plan_changed.emit()

## World column the player will occupy after every currently-planned move
## resolves. Non-move actions don't shift position.
func plan_cursor(player_x: int, player_y: int) -> Vector2i:
	var x: int = player_x
	var y: int = player_y
	for a: PlayerAction in plan:
		if a.type == PlayerAction.TYPE_MOVE:
			var d: Vector2i = direction_delta(a.direction)
			x += d.x
			y += d.y
	return Vector2i(x, y)

## Append a path of single-tile cardinal moves from the current plan cursor
## to (tx, ty). Diagonals are split into two moves; the walk interleaves
## x/y steps so the path stays close to a straight line. Truncates silently
## when the AP budget runs out \u2014 the engine validates each step at exec.
func append_path_to(tx: int, ty: int, player_x: int, player_y: int) -> void:
	if phase != PHASE_PLANNING:
		return
	var start: Vector2i = plan_cursor(player_x, player_y)
	var rem_x: int = absi(tx - start.x)
	var rem_y: int = absi(ty - start.y)
	var sx: int = signi(tx - start.x)
	var sy: int = signi(ty - start.y)

	var added: bool = false
	while rem_x > 0 or rem_y > 0:
		var step_x: bool = rem_x >= rem_y and rem_x > 0
		var dir: String
		if step_x:
			dir = "e" if sx > 0 else "w"
		else:
			dir = "s" if sy > 0 else "n"
		var action: PlayerAction = PlayerAction.move(dir)
		if not can_afford(action):
			break
		plan.append(action)
		added = true
		if step_x:
			rem_x -= 1
		else:
			rem_y -= 1
	if added:
		plan_changed.emit()

## Append a non-move action (harvest, pickup, eat, wait). Targeted actions
## de-dup by (type, target_id) so clicking the same button twice doesn't
## queue twice. Target-less actions (wait) skip dedupe \u2014 clicking N times
## queues N waits.
## (Eat-stacks etc. aren't modeled here yet \u2014 add when needed.)
func append_action(action: PlayerAction) -> void:
	if phase != PHASE_PLANNING:
		return
	if not can_afford(action):
		return
	if action.target_id != 0:
		for existing: PlayerAction in plan:
			if existing.type == action.type and existing.target_id == action.target_id:
				return
	plan.append(action)
	plan_changed.emit()

## Cardinal direction string \u2192 (dx, dy). Public so overlay code can walk
## the plan without depending on PlayerAction internals.
static func direction_delta(dir: String) -> Vector2i:
	match dir:
		"n": return Vector2i(0, -1)
		"s": return Vector2i(0, 1)
		"e": return Vector2i(1, 0)
		"w": return Vector2i(-1, 0)
		_: return Vector2i.ZERO
