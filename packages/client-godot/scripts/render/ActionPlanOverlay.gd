class_name ActionPlanOverlay
extends Node2D

## Renders the player's planned non-move actions (harvest, pickup, eat) as
## an "action" sprite overlay on each target entity's tile. Companion to
## MovePlanOverlay \u2014 they share the same row-14 sprite scheme via
## ColumnHighlight, just at a different column.
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

	var index: int = 0
	for target_id: int in _plan_store.planned_action_target_ids():
		var target: ViewEntity = _find_entity(_current_view, target_id)
		if target == null:
			continue
		# Use the topmost terrain z at the target's column so the indicator
		# sits on the visible top face rather than the entity's own z (which
		# may be the same, but for floating/stacked entities it's the
		# terrain we care about visually). Falls back to the entity's z when
		# the column has no known terrain.
		var top_z: int = _world_renderer.top_z_at(target.x, target.y)
		var z: int = top_z if top_z >= 0 else target.z
		var node: ColumnHighlight = _ensure_step(index)
		node.setup(_resources, _ACTION_COL)
		node.show_at(target.x, target.y, z)
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
