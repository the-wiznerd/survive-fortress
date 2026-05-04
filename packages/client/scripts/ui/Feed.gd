class_name Feed
extends VBoxContainer

## Bottom-of-sidebar action feed. Every entry is a notched-border chip with
## colored text — the border and text share a single color that conveys
## status. Multi-AP actions render as one chip whose height spans N rows.
##
## Driven by:
##   • PlanStore.plan_changed  — actions added or cleared
##   • PlanStore.phase_changed — submit/resolve transitions restyle chips
##   • set_view(view)          — needed to label targeted actions by entity
##                               name and to time-stamp history rounds

## Visual height of one AP slot. Multi-AP chips span N of these plus the
## inter-slot separation gap, so they read as taking up exactly N rows.
const _ROW_H: int = 24

## Slot status. Drives chip border + text color via a single palette pick.
## Queued and in-flight actions share the same PENDING styling — a chip
## looks the same whether the player is still building the round or the
## engine is about to / currently running it.
const _STATUS_EMPTY: int = 0
const _STATUS_PENDING: int = 1
const _STATUS_SUCCESS: int = 2
const _STATUS_FAILURE: int = 3

var _plan_store: PlanStore = null
var _view: GameView = null
## Last phase observed by _rebuild. Used to detect the RESOLVING → PLANNING
## transition so the just-finished round can be snapshotted into history
## before the resolving plan disappears from view, *and* the PLANNING →
## SUBMITTED transition so we can stamp the round's start tick.
var _prev_phase: String = ""
## World tick at which the current round began (= view.tick of the last
## planning frame, captured on the PLANNING → SUBMITTED transition). During
## RESOLVING this lets us compute `ticks_into_round = view.tick -
## _round_start_tick`, which drives the per-action timing for success and
## failure chip transitions.
var _round_start_tick: int = 0
## Past rounds, newest first. Each round is { "start_tick": int,
## "entries": Array of {label, cost, status, type} dictionaries }.
## Snapshotted at the RESOLVING → PLANNING transition so values are frozen
## against later view changes.
var _history: Array[Dictionary] = []

func _ready() -> void:
	add_theme_constant_override("separation", Spacing.XS)

## Wire the feed to the plan store. Subscribes to plan + phase changes and
## triggers an initial render.
func setup(plan_store: PlanStore) -> void:
	_plan_store = plan_store
	_plan_store.plan_changed.connect(_rebuild)
	_plan_store.phase_changed.connect(_rebuild)
	_rebuild()

## Push the latest GameView in. Needed so chips for targeted actions can
## resolve their target entity name (Harvest <bush>, Pickup <berry>) and
## so history snapshots can capture the round's start tick.
func set_view(view: GameView) -> void:
	_view = view
	_rebuild()

func _rebuild() -> void:
	for child: Node in get_children():
		remove_child(child)
		child.queue_free()
	if _plan_store == null:
		return
	# Capture history *before* re-rendering: when the engine finishes a round
	# the phase flips RESOLVING → PLANNING, and we want the just-resolved
	# slots to flow into history rather than be erased by the planning render.
	if _prev_phase == PlanStore.PHASE_RESOLVING and _plan_store.phase != PlanStore.PHASE_RESOLVING:
		_snapshot_round_to_history()
	# Stamp the round's start tick on PLANNING → SUBMITTED. _view is still the
	# last planning frame here, whose tick is the tick *before* this round's
	# first action runs — exactly what we want as the zero-point for the
	# per-action completion timing during resolution.
	if _prev_phase == PlanStore.PHASE_PLANNING and _plan_store.phase == PlanStore.PHASE_SUBMITTED and _view != null:
		_round_start_tick = _view.tick
	_prev_phase = _plan_store.phase

	if _plan_store.phase == PlanStore.PHASE_RESOLVING:
		_render_resolving()
	else:
		_render_planning_or_submitted()
	_render_history()

## During PLANNING the source of truth is PlanStore.plan — actions the player
## is currently arranging. SUBMITTED reads from the same place. Both render
## as PENDING so the chip's appearance doesn't shift between "queued" and
## "submitted, awaiting first frame".
func _render_planning_or_submitted() -> void:
	for action: PlayerAction in _plan_store.plan:
		var cost: int = _plan_store.action_cost(action)
		add_child(_make_chip(_label_for(action), cost, _STATUS_PENDING))

	# Empty slots only make sense while the player is still building a plan.
	# Once submitted, the budget is locked (and pad_with_waits has filled
	# every remaining slot with an explicit wait), so there's nothing left
	# to surface as "unspent."
	if _plan_store.phase == PlanStore.PHASE_PLANNING:
		var remaining: int = _plan_store.action_points_per_round - _plan_store.plan_cost()
		for i: int in range(remaining):
			add_child(_make_chip("1%s" % Fonts.ICON_AP, 1, _STATUS_EMPTY))

## During RESOLVING the per-tick GameView's player_plan is authoritative
## (PlanStore.plan is being trimmed to the unresolved tail). The engine's
## cursor (player_plan.index) tells us how far through the plan the actor
## has advanced; combined with `terminated` and per-action completion ticks,
## that staggers chip transitions across the playback so each failed/skipped
## action flips on the tick *it* would have completed, not all at once when
## the chain breaks.
func _render_resolving() -> void:
	if _view == null:
		return
	var plan: Array[PlayerAction] = _view.player_plan.actions
	var cursor: int = _view.player_plan.index
	var terminated: bool = _view.player_plan.terminated
	var ticks_in: int = _view.tick - _round_start_tick
	var cum: Array[int] = _cumulative_completion_ticks(plan)
	for i: int in range(plan.size()):
		var action: PlayerAction = plan[i]
		var cost: int = _plan_store.action_cost(action)
		add_child(_make_chip(_label_for(action), cost, _resolving_status(i, cursor, terminated, cum[i], ticks_in)))

## Cumulative completion tick (1-based, within the round) for each action.
## Action i would naturally complete at tick `sum(cost[0..i+1])`. We compare
## this against the playback's elapsed-in-round tick to decide whether a
## chip should still read as PENDING or has reached its completion moment.
func _cumulative_completion_ticks(plan: Array[PlayerAction]) -> Array[int]:
	var result: Array[int] = []
	var running: int = 0
	for action: PlayerAction in plan:
		running += _plan_store.action_cost(action)
		result.append(running)
	return result

## Status of action `idx` given the engine's cursor, termination flag, and
## the action's own would-complete tick relative to the playback's elapsed
## ticks in the round.
##
## Until ticks_in reaches cum_complete the chip is still PENDING — even if
## the engine already terminated, we hold the dramatic flip until the chip
## reaches the moment it *would have* finished. From there:
##   • idx < cursor       → SUCCESS (the engine actually completed it)
##   • terminated         → FAILURE (the failing action, or one skipped past)
##   • else (rare)        → SUCCESS (defensive fallthrough; in non-terminated
##                          rounds the cursor advances in lockstep with
##                          ticks_in, so this branch isn't reached)
func _resolving_status(idx: int, cursor: int, terminated: bool, cum_complete: int, ticks_in: int) -> int:
	if ticks_in < cum_complete:
		return _STATUS_PENDING
	if idx < cursor:
		return _STATUS_SUCCESS
	if terminated:
		return _STATUS_FAILURE
	return _STATUS_SUCCESS

## Capture the just-finished round into _history. Called once on the
## RESOLVING → PLANNING transition. Costs and labels are frozen at this
## moment so subsequent view updates can't retroactively change a past chip.
func _snapshot_round_to_history() -> void:
	if _view == null:
		return
	var plan: Array[PlayerAction] = _view.player_plan.actions
	var cursor: int = _view.player_plan.index
	var terminated: bool = _view.player_plan.terminated
	# Round is finished by the time we snapshot — every action has reached
	# its would-complete tick, so pass a saturated `ticks_in` to the status
	# helper. The result collapses to the final SUCCESS/FAILURE the chip had
	# at the last frame of playback.
	var ticks_in: int = _plan_store.action_points_per_round
	var cum: Array[int] = _cumulative_completion_ticks(plan)
	var entries: Array = []
	for i: int in range(plan.size()):
		var action: PlayerAction = plan[i]
		entries.append({
			"label": _label_for(action),
			"cost": _plan_store.action_cost(action),
			"status": _resolving_status(i, cursor, terminated, cum[i], ticks_in),
			"type": action.type,
		})
	if entries.is_empty():
		return
	# _view at snapshot time is the last frame of the round; subtracting the
	# round's AP gives the tick at which planning ended / resolution began.
	var start_tick: int = _view.tick - _plan_store.action_points_per_round
	# Newest round at the front so render order can iterate naturally and
	# clipping at the bottom drops the oldest entries first.
	_history.push_front({
		"start_tick": start_tick,
		"entries": entries,
	})

## Render past rounds below the current section. Each round is preceded by
## a Day X.YY label (the tick at which it was submitted) — that break in
## the visual rhythm separates rounds without needing an explicit divider.
## Consecutive waits within a round are coalesced into one multi-AP chip
## so a round that ended with "did X then waited five ticks" doesn't bury
## the meaningful actions under a row of identical Wait chips.
func _render_history() -> void:
	for round_data: Dictionary in _history:
		var start_tick: int = round_data["start_tick"]
		add_child(_make_round_header(start_tick))
		var entries: Array = round_data["entries"]
		var i: int = 0
		while i < entries.size():
			var entry: Dictionary = entries[i]
			var entry_type: String = entry["type"]
			if entry_type == PlayerAction.TYPE_WAIT:
				var run_end: int = i
				var combined_cost: int = 0
				while run_end < entries.size():
					var run_entry: Dictionary = entries[run_end]
					var run_entry_type: String = run_entry["type"]
					if run_entry_type != PlayerAction.TYPE_WAIT:
						break
					var run_entry_cost: int = run_entry["cost"]
					combined_cost += run_entry_cost
					run_end += 1
				# Status of the combined chip = status of the first wait in
				# the run. Waits never fail individually (their validate is
				# always true), so a wait-run ends up either entirely SUCCESS
				# (the engine ticked through them) or entirely FAILURE-as
				# -skipped (the plan terminated before reaching them) — never
				# mixed within a contiguous run.
				var label: String = entry["label"]
				var run_status: int = entry["status"]
				add_child(_make_chip(label, combined_cost, run_status))
				i = run_end
			else:
				var label: String = entry["label"]
				var cost: int = entry["cost"]
				var status: int = entry["status"]
				add_child(_make_chip(label, cost, status))
				i += 1

## Day X.YY marker placed before each historical round. Same format as the
## sidebar's game-state heading; rendered as plain DARKEST_GRAY text with
## no border or panel so it reads as a separator rather than a chip.
func _make_round_header(start_tick: int) -> Control:
	var day: int = Utils.divi(start_tick, Constants.TICKS_PER_DAY) + 1
	var tick_in_day: int = Utils.modi(start_tick, Constants.TICKS_PER_DAY)
	var label: Label = Text.label("Day %d.%02d" % [day, tick_in_day], Text.Ctx.ON_DARK)
	label.add_theme_color_override("font_color", Palette.DARKEST_GRAY)
	return label

# --- chip builder (single path for every slot status) ---

## Every chip — empty, pending, success, failure — flows through this one
## builder so dimensions stay byte-identical and there's no layout shift as
## a chip transitions between statuses. Status drives only the color used
## for both the notched border and the label text.
func _make_chip(label_text: String, ap_cost: int, status: int) -> Control:
	var color: Color = _color_for(status)
	var panel: PanelContainer = PanelContainer.new()
	var sb: NotchedBorderStyleBox = NotchedBorderStyleBox.new()
	sb.border_color = color
	sb.border_width = Constants.UI_PIXEL
	sb.notch_size = Constants.UI_PIXEL
	sb.content_margin_left = Spacing.SM
	sb.content_margin_right = Spacing.SM
	sb.content_margin_top = Spacing.XS
	sb.content_margin_bottom = Spacing.XS
	panel.add_theme_stylebox_override("panel", sb)
	# A multi-AP chip is taller by N rows + the (N-1) separation gaps it
	# absorbs by sitting where N single-AP chips would have stacked.
	panel.custom_minimum_size = Vector2(0, _ROW_H * ap_cost + Spacing.XS * (ap_cost - 1))
	var label: Label = Text.label(label_text, Text.Ctx.ON_DARK)
	label.add_theme_color_override("font_color", color)
	panel.add_child(label)
	return panel

func _color_for(status: int) -> Color:
	match status:
		_STATUS_EMPTY: return Palette.DARKEST_GRAY
		_STATUS_PENDING: return Palette.LIGHT_BLUE
		_STATUS_SUCCESS: return Palette.LIGHT_GREEN
		_STATUS_FAILURE: return Palette.LIGHT_RED
	return Palette.DARKEST_GRAY

# --- label formatting ---

func _label_for(action: PlayerAction) -> String:
	match action.type:
		PlayerAction.TYPE_MOVE: return "Move %s" % action.direction.to_upper()
		PlayerAction.TYPE_WAIT: return "Wait"
		PlayerAction.TYPE_HARVEST: return "Harvest %s" % _name_of(action.target_id)
		PlayerAction.TYPE_PICKUP: return "Pickup %s" % _name_of(action.target_id)
		PlayerAction.TYPE_DROP: return "Drop %s" % _name_of(action.target_id)
		PlayerAction.TYPE_EAT: return "Eat %s" % _name_of(action.target_id)
		_: return action.type

func _name_of(entity_id: int) -> String:
	if _view == null:
		return "?"
	for e: ViewEntity in _view.entities:
		if e.id == entity_id:
			if e.entity_name != "":
				return e.entity_name
			return e.type_name
	return "?"
