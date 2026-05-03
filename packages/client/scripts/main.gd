extends Node

## Entry point. Brings up the WebSocket connection, joins a save, hands the
## first GameView to the WorldRenderer, and centers the camera on the player.

const SERVER_URL: String = "ws://localhost:5174"
const DEFAULT_SAVE: String = "test-world"

## Minimum horizontal pointer travel (screen px) to count a right-button drag
## as a swipe gesture. Below this, the press+release is treated as a click and
## extends the planned path at the release position.
const _SWIPE_THRESHOLD_PX: float = 50.0

var _connection: GameConnection
var _world_renderer: WorldRenderer
var _camera: Camera2D
var _sidebar: Sidebar
var _column_inspector: ColumnInspector
var _selected_highlight: ColumnHighlight
var _hover_highlight: ColumnHighlight
var _move_plan_overlay: MovePlanOverlay
var _action_plan_overlay: ActionPlanOverlay
var _plan_store: PlanStore
var _resolution_player: ResolutionPlayer
## Latest GameView from `joined` or `round-resolve`. Cached so input handlers
## (right-click path planning) don't need to ask the connection for it.
var _last_view: GameView = null

## Right-button drag tracking. Press is recorded in _unhandled_input (only
## fires over the world), release is read in _input (sees events even over
## the sidebar) so a swipe that ends on the sidebar isn't lost.
var _right_press_active: bool = false
var _right_press_pos: Vector2 = Vector2.ZERO

func _ready() -> void:
	_world_renderer = WorldRenderer.new()
	_world_renderer.name = "WorldRenderer"
	add_child(_world_renderer)

	# Highlights are mounted *inside* WorldRenderer so they participate in
	# the same Y-sort tree as terrain and entities — that lets entities
	# standing on the inspected column render over the highlight, while the
	# highlight still paints over the terrain top face beneath them.
	# Hover is added before selected so that when both land on the same
	# column, selected wins the same-z, same-y tree-order tiebreak.
	_hover_highlight = ColumnHighlight.new()
	_hover_highlight.name = "HoverHighlight"
	_world_renderer.add_child(_hover_highlight)
	_hover_highlight.setup(_world_renderer.get_resources(), ColumnHighlight.HOVER_COL)

	_selected_highlight = ColumnHighlight.new()
	_selected_highlight.name = "SelectedHighlight"
	_world_renderer.add_child(_selected_highlight)
	_selected_highlight.setup(_world_renderer.get_resources(), ColumnHighlight.SELECTED_COL)

	_plan_store = PlanStore.new()
	_plan_store.name = "PlanStore"
	add_child(_plan_store)

	# MovePlanOverlay sits inside WorldRenderer like the highlights so its
	# step sprites Y-sort with terrain and entities. It rebuilds whenever the
	# plan changes or a new view arrives.
	_move_plan_overlay = MovePlanOverlay.new()
	_move_plan_overlay.name = "MovePlanOverlay"
	_world_renderer.add_child(_move_plan_overlay)
	_move_plan_overlay.setup(_world_renderer.get_resources(), _world_renderer, _plan_store)

	_action_plan_overlay = ActionPlanOverlay.new()
	_action_plan_overlay.name = "ActionPlanOverlay"
	_world_renderer.add_child(_action_plan_overlay)
	_action_plan_overlay.setup(_world_renderer.get_resources(), _world_renderer, _plan_store)

	_resolution_player = ResolutionPlayer.new()
	_resolution_player.name = "ResolutionPlayer"
	add_child(_resolution_player)
	_resolution_player.tick_advanced.connect(_on_resolution_tick)

	_camera = Camera2D.new()
	_camera.name = "Camera"
	# Pixel-art friendly defaults: integer snapping + nearest-neighbor scaling.
	_camera.zoom = Vector2(3.0, 3.0)
	_camera.position_smoothing_enabled = false
	# Sidebar covers the right WIDTH screen pixels. Shift the camera target
	# right (in world units) by half the sidebar width so the player ends up
	# centered in the *visible* (non-sidebar) region instead of behind it.
	_camera.offset = Vector2(Sidebar.WIDTH * 0.5 / _camera.zoom.x, 0)
	add_child(_camera)

	_sidebar = Sidebar.new()
	_sidebar.name = "Sidebar"
	_sidebar.bag_clicked.connect(_on_bag_clicked)
	_sidebar.settings_clicked.connect(_on_settings_clicked)
	add_child(_sidebar)
	_sidebar.setup_feed(_plan_store)

	_column_inspector = ColumnInspector.new()
	_column_inspector.name = "ColumnInspector"
	_column_inspector.closed.connect(_on_inspector_closed)
	_column_inspector.action_requested.connect(_on_inspector_action_requested)
	add_child(_column_inspector)

	_connection = GameConnection.new()
	_connection.name = "GameConnection"
	add_child(_connection)
	_connection.connected.connect(_on_connected)
	_connection.disconnected.connect(_on_disconnected)
	_connection.connection_error.connect(_on_connection_error)
	_connection.joined.connect(_on_joined)
	_connection.round_resolve.connect(_on_round_resolve)
	_connection.server_error.connect(_on_server_error)
	_connection.unknown_message.connect(_on_unknown_message)
	print("[Main] Connecting to ", SERVER_URL, " ...")
	_connection.connect_to_server(SERVER_URL)

func _on_connected() -> void:
	print("[Main] Connection ready. Joining save '", DEFAULT_SAVE, "'...")
	_connection.send_join(DEFAULT_SAVE)

func _on_disconnected(code: int, reason: String) -> void:
	print("[Main] Connection closed (code=%d reason=%s)" % [code, reason])

func _on_connection_error(message: String) -> void:
	push_error("[Main] " + message)

func _on_joined(msg: ServerMessage) -> void:
	var view: GameView = msg.view
	print("[Main] Joined. tick=%d player=%s entities=%d AP/round=%d turn_mode=%s" % [
		view.tick,
		view.player_id,
		view.entities.size(),
		msg.action_points_per_round,
		msg.turn_mode,
	])
	print("[Main] Action costs: ", msg.action_costs)
	_last_view = view
	_plan_store.configure(msg.action_points_per_round, msg.action_costs)
	_plan_store.set_view(view)
	_world_renderer.render_view(view)
	_sidebar.update_view(view)
	_column_inspector.set_view(view)
	_move_plan_overlay.set_view(view)
	_action_plan_overlay.set_view(view)
	_center_camera_on_player(view)

## Frames arrive in one batch from the server. Hand them off to the
## ResolutionPlayer for paced playback so the player sees each tick advance
## in turn \u2014 the feed transitions slot-by-slot, the world updates per tick,
## and the inspector / overlays follow along. Plan store is cleared on entry
## so the planning overlays (move arrows, action indicators) disappear while
## the engine runs; the feed switches its source to per-frame player_plan.
func _on_round_resolve(msg: ServerMessage) -> void:
	print("[Main] Round resolved with %d frames." % msg.frames.size())
	if msg.frames.is_empty():
		# Nothing to play back \u2014 return straight to planning so the player
		# isn't stuck in SUBMITTED.
		_plan_store.phase = PlanStore.PHASE_PLANNING
		return
	_plan_store.phase = PlanStore.PHASE_RESOLVING
	_plan_store.clear()
	_resolution_player.play(msg.frames)

## One frame of the resolving round: push it through every consumer so the
## world, sidebar, feed, and overlays all reflect the same tick. On the last
## frame, drop back to PLANNING so the player can build the next round.
func _on_resolution_tick(view: GameView, is_last: bool) -> void:
	_last_view = view
	_plan_store.set_view(view)
	_world_renderer.render_view(view)
	_sidebar.update_view(view)
	_column_inspector.set_view(view)
	_move_plan_overlay.set_view(view)
	_action_plan_overlay.set_view(view)
	_center_camera_on_player(view)
	if is_last:
		_plan_store.phase = PlanStore.PHASE_PLANNING

func _on_server_error(message: String) -> void:
	push_error("[Main] Server error: " + message)

func _on_unknown_message(raw: Dictionary) -> void:
	push_warning("[Main] Unknown message: " + str(raw.keys()))

func _on_bag_clicked() -> void:
	print("[Main] Bag clicked (container popup not implemented yet).")

func _on_settings_clicked() -> void:
	print("[Main] Settings clicked (settings popup not implemented yet).")

## Left-click on the world opens (or toggles closed) the column inspector.
## Right-button press over the world arms a drag: on release, a horizontal
## swipe past `_SWIPE_THRESHOLD_PX` becomes a submit (right) or clear (left)
## gesture; otherwise it extends the planned movement path at the release
## position. _unhandled_input fires only for events not consumed by Control
## nodes (sidebar, inspector chrome), so the press is naturally scoped to the
## world; the release is read in _input so a swipe that ends on the sidebar
## isn't lost when the sidebar consumes the event.
func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		var mm: InputEventMouseMotion = event
		_update_hover_at(mm.position)
		return
	if event is InputEventMouseButton:
		var mb: InputEventMouseButton = event
		if mb.button_index == MOUSE_BUTTON_LEFT and mb.pressed:
			_handle_click_at(mb.position)
		elif mb.button_index == MOUSE_BUTTON_RIGHT and mb.pressed:
			_right_press_active = true
			_right_press_pos = mb.position

## Catches right-button release events even when they happen over UI Controls
## (which would otherwise consume them before _unhandled_input sees them).
## Only acts when a press was previously registered over the world.
func _input(event: InputEvent) -> void:
	if not (event is InputEventMouseButton):
		return
	var mb: InputEventMouseButton = event
	if mb.button_index != MOUSE_BUTTON_RIGHT or mb.pressed:
		return
	if not _right_press_active:
		return
	_right_press_active = false
	_classify_right_release(_right_press_pos, mb.position)

## Decide whether a press\u2192release pair is a swipe or a click and dispatch.
## Horizontal-dominant motion past the threshold is a gesture; anything
## smaller falls through to the existing path-extend behaviour.
func _classify_right_release(press_pos: Vector2, release_pos: Vector2) -> void:
	var dx: float = release_pos.x - press_pos.x
	var dy: float = release_pos.y - press_pos.y
	if absf(dx) >= _SWIPE_THRESHOLD_PX and absf(dx) > absf(dy):
		if dx < 0.0:
			_handle_swipe_submit()
		else:
			_handle_swipe_clear()
		return
	_handle_right_click_at(release_pos)

## Swipe-right gesture: submit the current plan to the server and lock the
## phase to SUBMITTED. Round-resolve resets back to PLANNING and clears the
## plan. No-op outside the planning phase so a stray swipe during resolution
## can't double-submit.
func _handle_swipe_submit() -> void:
	if _plan_store.phase != PlanStore.PHASE_PLANNING:
		print("[Main] Swipe submit ignored \u2014 phase=", _plan_store.phase)
		return
	print("[Main] Swipe submit \u2014 sending %d action(s)." % _plan_store.plan.size())
	_connection.send_plan(_plan_store.plan)
	_plan_store.phase = PlanStore.PHASE_SUBMITTED

## Swipe-left gesture: drop the current in-progress plan. No-op outside
## planning so we can't wipe a plan the engine is already running.
func _handle_swipe_clear() -> void:
	if _plan_store.phase != PlanStore.PHASE_PLANNING:
		print("[Main] Swipe clear ignored \u2014 phase=", _plan_store.phase)
		return
	print("[Main] Swipe clear \u2014 dropping %d action(s)." % _plan_store.plan.size())
	_plan_store.clear()

## Convert a screen-space mouse position to a world column (col_x, col_y).
## The screen → world transform is the inverse of the viewport's canvas
## transform (which encodes the active Camera2D).
func _column_at_screen(screen_pos: Vector2) -> Vector2i:
	var world_pos: Vector2 = get_viewport().get_canvas_transform().affine_inverse() * screen_pos
	return Vector2i(
		floori(world_pos.x / float(Constants.TILE_W)),
		floori(world_pos.y / float(Constants.TOP_FACE_H)),
	)

## Open the inspector at the clicked column, or close it if the same column
## is clicked again (toggle behavior).
func _handle_click_at(screen_pos: Vector2) -> void:
	var col: Vector2i = _column_at_screen(screen_pos)
	if _column_inspector.is_open() \
			and _column_inspector.column_x() == col.x \
			and _column_inspector.column_y() == col.y:
		_column_inspector.close()
		return
	var top_z: int = _world_renderer.top_z_at(col.x, col.y)
	_column_inspector.show_column(col.x, col.y, top_z)
	_selected_highlight.show_at(col.x, col.y, maxi(top_z, 0))

## Right-click extends the planned movement path from the plan cursor (the
## position the player will occupy after all currently-planned moves resolve)
## to the clicked column, using a cardinal-only walk that hugs the straight
## line between them. Truncated silently when the AP budget runs out. The
## arrow chain re-renders via PlanStore.plan_changed.
func _handle_right_click_at(screen_pos: Vector2) -> void:
	if _last_view == null:
		return
	var player: ViewEntity = _find_player(_last_view)
	if player == null:
		return
	var col: Vector2i = _column_at_screen(screen_pos)
	_plan_store.append_path_to(col.x, col.y, player.x, player.y)

static func _find_player(view: GameView) -> ViewEntity:
	var pid: int = view.player_id.to_int()
	for e: ViewEntity in view.entities:
		if e.id == pid:
			return e
	return null

## Reposition the hover highlight under the cursor. Hides it when the cursor
## isn't over a known terrain column so we don't paint a stray overlay over
## empty space.
func _update_hover_at(screen_pos: Vector2) -> void:
	var col: Vector2i = _column_at_screen(screen_pos)
	var top_z: int = _world_renderer.top_z_at(col.x, col.y)
	if top_z < 0:
		_hover_highlight.hide_highlight()
		return
	_hover_highlight.show_at(col.x, col.y, top_z)

## Mouse motion is consumed by Controls with mouse_filter = STOP (sidebar,
## inspector chrome), so _unhandled_input doesn't fire while the cursor is
## over UI \u2014 the hover indicator would otherwise stick at its last world
## position. Each frame, hide it whenever a UI Control is hovered or the OS
## cursor has left the window. Cheap: gui_get_hovered_control() is O(1) and
## we early-out when nothing is showing.
func _process(_delta: float) -> void:
	if not _hover_highlight.visible:
		return
	var vp: Viewport = get_viewport()
	if vp.gui_get_hovered_control() != null:
		_hover_highlight.hide_highlight()
		return
	var mouse: Vector2 = vp.get_mouse_position()
	var size: Vector2 = vp.get_visible_rect().size
	if mouse.x < 0 or mouse.y < 0 or mouse.x >= size.x or mouse.y >= size.y:
		_hover_highlight.hide_highlight()

func _on_inspector_closed() -> void:
	_selected_highlight.hide_highlight()

## Inspector emitted an action button click (e.g. bush "Harvest"). Forward to
## the plan store, which de-dups + AP-checks before appending. The action
## overlay rebuilds via PlanStore.plan_changed.
func _on_inspector_action_requested(action: PlayerAction) -> void:
	_plan_store.append_action(action)

## Move the camera to the player's projected screen position, offset to the
## center of the tile so the player sprite sits in the middle of the viewport.
func _center_camera_on_player(view: GameView) -> void:
	var player_id_int: int = view.player_id.to_int()
	for entity: ViewEntity in view.entities:
		if entity.id == player_id_int:
			var half_tile: Vector2 = Vector2(Constants.TILE_W, Constants.TOP_FACE_H) * 0.5
			_camera.position = Utils.project(entity.x, entity.y, entity.z) + half_tile
			return
	push_warning("[Main] Player entity (id=%d) not found in view; camera not centered." % player_id_int)
