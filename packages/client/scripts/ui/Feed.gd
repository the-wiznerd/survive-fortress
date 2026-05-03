class_name Feed
extends VBoxContainer

## Bottom-of-sidebar action feed. Renders the current planning round as a
## stack of slot-per-AP chips, with empty slots filling the remaining budget.
## A queued multi-AP action is one chip whose height spans N rows.
##
## Driven by:
##   • PlanStore.plan_changed  — actions added or cleared
##   • PlanStore.phase_changed — submit/resolve transitions restyle chips
##   • set_view(view)          — needed to label targeted actions by entity
##
## Per-tick playback (slot-by-slot success/failure transitions during
## resolution) and history accumulation come in later steps.

## Visual height of one AP slot. Multi-AP chips span N of these plus the
## inter-slot separation gap, so they read as taking up exactly N rows.
const _ROW_H: int = 24

## Slot status. Drives chip background, border, and text styling. Pending
## covers both SUBMITTED (sent, awaiting resolve) and RESOLVING-but-not-yet
## -this-tick. The HISTORICAL_* variants are how SUCCESS/FAILURE re-render
## once the round has completed and the slot has fallen into history — same
## label, no background, lighter text. EMPTY is the unspent-AP placeholder.
const _STATUS_EMPTY: int = 0
const _STATUS_QUEUED: int = 1
const _STATUS_PENDING: int = 2
const _STATUS_SUCCESS: int = 3
const _STATUS_FAILURE: int = 4
const _STATUS_HISTORICAL_SUCCESS: int = 5
const _STATUS_HISTORICAL_FAILURE: int = 6

var _plan_store: PlanStore = null
var _view: GameView = null
## Last phase observed by _rebuild. Used to detect the RESOLVING → PLANNING
## transition so the just-finished round can be snapshotted into history
## before the resolving plan disappears from view.
var _prev_phase: String = ""
## Past rounds, newest first. Each round is an Array of Dictionary entries
## with "label" (String), "cost" (int), "status" (int — _STATUS_SUCCESS or
## _STATUS_FAILURE). Captured at the moment the round transitions out of
## resolving so values are frozen against later view changes.
var _history: Array[Array] = []

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
## resolve their target entity name (Harvest <bush>, Pickup <berry>).
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
	_prev_phase = _plan_store.phase

	if _plan_store.phase == PlanStore.PHASE_RESOLVING:
		_render_resolving()
	else:
		_render_planning_or_submitted()
	_render_history()

## During PLANNING the source of truth is PlanStore.plan — actions the player
## is currently arranging. SUBMITTED reads from the same place but styles
## chips as pending while the server processes the round.
func _render_planning_or_submitted() -> void:
	var status: int = _STATUS_QUEUED if _plan_store.phase == PlanStore.PHASE_PLANNING else _STATUS_PENDING
	for action: PlayerAction in _plan_store.plan:
		var cost: int = _plan_store.action_cost(action)
		add_child(_make_chip(_label_for(action), cost, status))

	# Empty slots only make sense while the player is still building a plan.
	# Once submitted, the budget is locked and unallocated AP becomes implicit
	# idle ticks at the engine level — no slot to render for them.
	if _plan_store.phase == PlanStore.PHASE_PLANNING:
		var remaining: int = _plan_store.action_points_per_round - _plan_store.plan_cost()
		for i: int in range(remaining):
			add_child(_make_chip("1%s" % Fonts.ICON_AP, 1, _STATUS_EMPTY))

## During RESOLVING the per-tick GameView's player_plan is authoritative
## (PlanStore.plan was cleared on the phase transition). The engine's cursor
## (player_plan.index) tells us how far through the plan the actor has
## advanced; combined with `terminated`, that gives each chip its status.
func _render_resolving() -> void:
	if _view == null:
		return
	var plan: Array[PlayerAction] = _view.player_plan.actions
	var cursor: int = _view.player_plan.index
	var terminated: bool = _view.player_plan.terminated
	for i: int in range(plan.size()):
		var action: PlayerAction = plan[i]
		var cost: int = _plan_store.action_cost(action)
		add_child(_make_chip(_label_for(action), cost, _resolving_status(i, cursor, terminated)))

## Map an action's index in the plan to a chip status given the engine's
## current cursor. The cursor stays on an in-progress multi-AP action until
## it completes; on plan termination, it points at the action that failed.
func _resolving_status(action_idx: int, cursor: int, terminated: bool) -> int:
	if action_idx < cursor:
		return _STATUS_SUCCESS
	if terminated:
		# Failing action sits at the cursor; everything past it never ran.
		# A dedicated "skipped" style can come later — for now both render as
		# failure so the player sees where the plan went off the rails.
		return _STATUS_FAILURE
	return _STATUS_PENDING

## Capture the just-finished round into _history. Called once on the
## RESOLVING → PLANNING transition. Costs and labels are frozen at this
## moment so subsequent view updates can't retroactively change a past chip.
func _snapshot_round_to_history() -> void:
	if _view == null:
		return
	var plan: Array[PlayerAction] = _view.player_plan.actions
	var cursor: int = _view.player_plan.index
	var terminated: bool = _view.player_plan.terminated
	var entries: Array = []
	for i: int in range(plan.size()):
		var action: PlayerAction = plan[i]
		var status: int = _resolving_status(i, cursor, terminated)
		# Status only ever resolves to SUCCESS or FAILURE here — by snapshot
		# time the cursor has reached the end (cursor == plan.size) or the
		# plan has terminated, so no PENDING ever lands in history.
		entries.append({
			"label": _label_for(action),
			"cost": _plan_store.action_cost(action),
			"status": status,
		})
	if entries.is_empty():
		return
	# Newest round at the front so render order can iterate naturally and
	# clipping at the bottom drops the oldest entries first.
	_history.push_front(entries)

## Render past rounds below the current section. Each round is preceded by
## a thin divider so boundaries are visible; the first divider also
## separates history from the current planning/submitted/resolving section.
func _render_history() -> void:
	for round_entries: Array in _history:
		add_child(_make_history_divider())
		for entry: Dictionary in round_entries:
			var label: String = entry["label"]
			var cost: int = entry["cost"]
			var status: int = entry["status"]
			add_child(_make_chip(label, cost, _to_historical_status(status)))

## Translate a resolved status into its less-emphatic historical sibling.
## Anything that wasn't SUCCESS or FAILURE (shouldn't normally happen in
## history, but kept defensively) renders unchanged.
func _to_historical_status(status: int) -> int:
	match status:
		_STATUS_SUCCESS: return _STATUS_HISTORICAL_SUCCESS
		_STATUS_FAILURE: return _STATUS_HISTORICAL_FAILURE
	return status

func _make_history_divider() -> Control:
	var div: ColorRect = ColorRect.new()
	div.color = Palette.DARKEST_GRAY
	div.custom_minimum_size = Vector2(0, Constants.UI_PIXEL)
	return div

# --- chip builder (single path for every slot status) ---

## All slots — empty, queued, pending, resolved, historical — go through
## this builder so dimensions are byte-identical and there's no layout shift
## as a chip transitions between statuses. Status drives only three things:
## the stylebox (filled / bordered / transparent), the text content's
## chrome-context, and an optional explicit text color override.
func _make_chip(label_text: String, ap_cost: int, status: int) -> Control:
	var panel: PanelContainer = PanelContainer.new()
	panel.add_theme_stylebox_override("panel", _stylebox_for(status))
	# A multi-AP chip is taller by N rows + the (N-1) separation gaps it
	# absorbs by sitting where N single-AP chips would have stacked.
	panel.custom_minimum_size = Vector2(0, _ROW_H * ap_cost + Spacing.XS * (ap_cost - 1))
	var label: Label = Text.label(label_text, _chip_text_ctx(status))
	_apply_chip_text_color_override(label, status)
	panel.add_child(label)
	return panel

## StyleBox per status. All variants apply the same content margins so the
## label sits in the same spot regardless of bg/border treatment, which is
## what keeps every status visually the same size.
func _stylebox_for(status: int) -> StyleBox:
	match status:
		_STATUS_EMPTY:
			return _bordered_stylebox(Palette.DARKEST_GRAY)
		_STATUS_QUEUED:
			return _filled_stylebox(Palette.WHITE)
		_STATUS_PENDING:
			return _filled_stylebox(Palette.GRAY)
		_STATUS_SUCCESS:
			return _filled_stylebox(Palette.DARK_GREEN)
		_STATUS_FAILURE:
			return _filled_stylebox(Palette.DARK_RED)
		_STATUS_HISTORICAL_SUCCESS, _STATUS_HISTORICAL_FAILURE:
			return _transparent_stylebox()
	return _filled_stylebox(Palette.WHITE)

func _filled_stylebox(bg: Color) -> NotchedStyleBox:
	var sb: NotchedStyleBox = NotchedStyleBox.new()
	sb.bg_color = bg
	sb.notch_size = Constants.UI_PIXEL
	_apply_chip_margins(sb)
	return sb

func _bordered_stylebox(border: Color) -> StyleBoxFlat:
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	sb.bg_color = Color(0, 0, 0, 0)
	sb.border_color = border
	sb.border_width_left = Constants.UI_PIXEL
	sb.border_width_right = Constants.UI_PIXEL
	sb.border_width_top = Constants.UI_PIXEL
	sb.border_width_bottom = Constants.UI_PIXEL
	_apply_chip_margins(sb)
	return sb

func _transparent_stylebox() -> StyleBoxFlat:
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	sb.bg_color = Color(0, 0, 0, 0)
	_apply_chip_margins(sb)
	return sb

func _apply_chip_margins(sb: StyleBox) -> void:
	sb.content_margin_left = Spacing.SM
	sb.content_margin_right = Spacing.SM
	sb.content_margin_top = Spacing.XS
	sb.content_margin_bottom = Spacing.XS

func _chip_text_ctx(status: int) -> Text.Ctx:
	# Light chip background → ON_LIGHT text. Everything else uses the dark
	# variant since the chip bg is mid-to-dark or transparent on a black
	# sidebar background.
	if status == _STATUS_QUEUED:
		return Text.Ctx.ON_LIGHT
	return Text.Ctx.ON_DARK

## Per-status text color overrides for cases where the Text design system's
## ON_DARK / ON_LIGHT defaults aren't the right shade. No-op for statuses
## that take the default.
func _apply_chip_text_color_override(label: Label, status: int) -> void:
	match status:
		_STATUS_EMPTY:
			# Most muted available swatch — barely-there hint of what an
			# unspent slot would cost (1 AP).
			label.add_theme_color_override("font_color", Palette.DARKEST_GRAY)
		_STATUS_HISTORICAL_SUCCESS:
			label.add_theme_color_override("font_color", Palette.LIGHTEST_GREEN)
		_STATUS_HISTORICAL_FAILURE:
			label.add_theme_color_override("font_color", Palette.LIGHTEST_RED)

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
