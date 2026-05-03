class_name ActionPlanOverlay
extends Node2D

## Renders the player's planned non-move actions as overlay sprites on tiles:
##   - Targeted actions (harvest, pickup, eat) sit on the target entity's
##     tile, sourced from the live view so a target that wandered moves with
##     the indicator.
##   - Wait sits on the projected player position at that point in the plan
##     (i.e. the cursor walked through preceding moves).
##
## Companion to MovePlanOverlay \u2014 they share the same row-14 sprite scheme via
## ColumnHighlight, just at different columns.
##
## Driven by the same two inputs as MovePlanOverlay:
##   1. PlanStore.plan_changed
##   2. set_view(view)
## Either triggers a full rebuild that pools child highlights for reuse.

const _ACTION_COL: int = 6

var _resources: RenderResources = null
var _world_renderer: WorldRenderer = null
var _plan_store: PlanStore = null
var _current_view: GameView = null
var _pool: Array[ColumnHighlight] = []

func _ready() -> void:
	# Y-sort participation: WorldRenderer sorts its direct children, but our
	# ColumnHighlights are nested under us. Enabling y_sort_enabled here lets
	# their per-tile y positions propagate into WorldRenderer's sort, so an
	# entity standing on the target tile (e.g. the bush being harvested)
	# correctly draws over the indicator instead of under it.
	y_sort_enabled = true

func setup(resources: RenderResources, world_renderer: WorldRenderer, plan_store: PlanStore) -> void:
	_resources = resources
	_world_renderer = world_renderer
	_plan_store = plan_store
	_plan_store.plan_changed.connect(_rebuild)

## Push the latest world view in. Triggers a rebuild so target tiles track
## entity movement (e.g. an animal queued for harvest that wandered).
func set_view(view: GameView) -> void:
	_current_view = view
	_rebuild()

func _rebuild() -> void:
	if _plan_store == null or _current_view == null:
		_hide_all()
		return
	var player: ViewEntity = _find_player(_current_view)
	if player == null:
		_hide_all()
		return

	# Walk the plan, advancing the cursor on moves so wait indicators land
	# at the position the player will actually be when the wait happens.
	var x: int = player.x
	var y: int = player.y
	var index: int = 0
	for a: PlayerAction in _plan_store.plan:
		if a.type == PlayerAction.TYPE_MOVE:
			var d: Vector2i = PlanStore.direction_delta(a.direction)
			x += d.x
			y += d.y
			continue
		var tx: int
		var ty: int
		if a.type == PlayerAction.TYPE_WAIT:
			tx = x
			ty = y
		else:
			var target: ViewEntity = _find_entity(_current_view, a.target_id)
			if target == null:
				continue
			tx = target.x
			ty = target.y
		var top_z: int = _world_renderer.top_z_at(tx, ty)
		var z: int = maxi(top_z, 0)
		var node: ColumnHighlight = _ensure_step(index)
		node.setup(_resources, _ACTION_COL)
		node.show_at(tx, ty, z)
		index += 1

	for i in range(index, _pool.size()):
		_pool[i].hide_highlight()

func _ensure_step(i: int) -> ColumnHighlight:
	while _pool.size() <= i:
		var ch: ColumnHighlight = ColumnHighlight.new()
		ch.name = "Action_%d" % _pool.size()
		add_child(ch)
		_pool.append(ch)
	return _pool[i]

func _hide_all() -> void:
	for ch: ColumnHighlight in _pool:
		ch.hide_highlight()

static func _find_entity(view: GameView, id: int) -> ViewEntity:
	for e: ViewEntity in view.entities:
		if e.id == id:
			return e
	return null

static func _find_player(view: GameView) -> ViewEntity:
	var pid: int = view.player_id.to_int()
	for e: ViewEntity in view.entities:
		if e.id == pid:
			return e
	return null
