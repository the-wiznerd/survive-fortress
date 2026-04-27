class_name MovePlanOverlay
extends Node2D

## Renders the player's planned moves as a chain of arrow overlays, one
## ColumnHighlight per step. Reuses the same overlay-row sprite scheme as
## hover/selected highlights so paint order, edge alignment, and scaling are
## identical \u2014 the only thing that changes per step is which column of
## row 14 the sprite samples.
##
## Mounted under WorldRenderer alongside the other highlights.
##
## Driven by two inputs:
##   1. PlanStore.plan_changed \u2014 the plan array was mutated.
##   2. set_view(view) \u2014 the world view advanced (tick or round resolve).
## Either input triggers a full rebuild from scratch. Children are pooled and
## reused across rebuilds so we don't churn the scene tree on every keystroke.

const _ARROW_ROW: int = ColumnHighlight.OVERLAY_ROW

## Sprite columns for cardinal-arrow overlays. Mirrors arrowCol() in the
## legacy TS renderer.
const _ARROW_COL_N: int = 2
const _ARROW_COL_E: int = 3
const _ARROW_COL_S: int = 4
const _ARROW_COL_W: int = 5

var _resources: RenderResources = null
var _world_renderer: WorldRenderer = null
var _plan_store: PlanStore = null
var _current_view: GameView = null
var _pool: Array[ColumnHighlight] = []

func _ready() -> void:
	# See ActionPlanOverlay for the rationale: enabling y-sort here lets each
	# step's per-tile y participate in WorldRenderer's sort, so entities on a
	# tile a planned step crosses correctly draw over the arrow.
	y_sort_enabled = true

## Wire to the shared sprite atlas, the world (for column z lookup), and the
## plan store. Subscribes to plan changes immediately.
func setup(resources: RenderResources, world_renderer: WorldRenderer, plan_store: PlanStore) -> void:
	_resources = resources
	_world_renderer = world_renderer
	_plan_store = plan_store
	_plan_store.plan_changed.connect(_rebuild)

## Push the latest world view in. Triggers a rebuild so the overlay tracks
## the player's new position after a round resolves.
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

	var x: int = player.x
	var y: int = player.y
	var step_index: int = 0
	for a: PlayerAction in _plan_store.plan:
		if a.type != PlayerAction.TYPE_MOVE:
			continue
		var d: Vector2i = PlanStore.direction_delta(a.direction)
		x += d.x
		y += d.y
		var top_z: int = _world_renderer.top_z_at(x, y)
		# Step on a column we have no terrain knowledge of \u2014 still show
		# the arrow at z=0 so the player can see where the step lands. The
		# server will validate the path at execution time.
		var z: int = maxi(top_z, 0)
		var node: ColumnHighlight = _ensure_step(step_index)
		node.setup(_resources, _arrow_col(d.x, d.y))
		node.show_at(x, y, z)
		step_index += 1

	for i in range(step_index, _pool.size()):
		_pool[i].hide_highlight()

func _ensure_step(i: int) -> ColumnHighlight:
	while _pool.size() <= i:
		var ch: ColumnHighlight = ColumnHighlight.new()
		ch.name = "Step_%d" % _pool.size()
		add_child(ch)
		_pool.append(ch)
	return _pool[i]

func _hide_all() -> void:
	for ch: ColumnHighlight in _pool:
		ch.hide_highlight()

static func _arrow_col(dx: int, dy: int) -> int:
	if dy < 0:
		return _ARROW_COL_N
	if dx > 0:
		return _ARROW_COL_E
	if dy > 0:
		return _ARROW_COL_S
	return _ARROW_COL_W

static func _find_player(view: GameView) -> ViewEntity:
	var pid: int = view.player_id.to_int()
	for e: ViewEntity in view.entities:
		if e.id == pid:
			return e
	return null
