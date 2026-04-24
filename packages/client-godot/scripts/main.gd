extends Node

## Entry point. Brings up the WebSocket connection, joins a save, hands the
## first GameView to the WorldRenderer, and centers the camera on the player.

const SERVER_URL: String = "ws://localhost:5174"
const DEFAULT_SAVE: String = "test-world"

var _connection: GameConnection
var _world_renderer: WorldRenderer
var _camera: Camera2D
var _sidebar: Sidebar
var _column_inspector: ColumnInspector

func _ready() -> void:
	_world_renderer = WorldRenderer.new()
	_world_renderer.name = "WorldRenderer"
	add_child(_world_renderer)

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

	_column_inspector = ColumnInspector.new()
	_column_inspector.name = "ColumnInspector"
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
	_world_renderer.render_view(view)
	_sidebar.update_view(view)
	_center_camera_on_player(view)

func _on_round_resolve(msg: ServerMessage) -> void:
	print("[Main] Round resolved with %d frames." % msg.frames.size())
	if msg.frames.size() > 0:
		var last: GameView = msg.frames[msg.frames.size() - 1]
		print("[Main]   final tick=%d entities=%d" % [last.tick, last.entities.size()])
		_world_renderer.render_view(last)
		_sidebar.update_view(last)
		_center_camera_on_player(last)

func _on_server_error(message: String) -> void:
	push_error("[Main] Server error: " + message)

func _on_unknown_message(raw: Dictionary) -> void:
	push_warning("[Main] Unknown message: " + str(raw.keys()))

func _on_bag_clicked() -> void:
	print("[Main] Bag clicked (container popup not implemented yet).")

func _on_settings_clicked() -> void:
	print("[Main] Settings clicked (settings popup not implemented yet).")

## Left-click on the world opens the column inspector. _unhandled_input fires
## only for events not consumed by Control nodes (sidebar, inspector chrome),
## so clicks on UI never reach this handler.
func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		var mb: InputEventMouseButton = event
		if mb.pressed and mb.button_index == MOUSE_BUTTON_LEFT:
			_open_inspector_at(mb.position)

## Convert a screen-space mouse position to a world column (x, y) and open
## the inspector there. The screen → world transform is the inverse of the
## viewport's canvas transform (which encodes the active Camera2D).
func _open_inspector_at(screen_pos: Vector2) -> void:
	var world_pos: Vector2 = get_viewport().get_canvas_transform().affine_inverse() * screen_pos
	var col_x: int = floori(world_pos.x / float(Constants.TILE_W))
	var col_y: int = floori(world_pos.y / float(Constants.TOP_FACE_H))
	var top_z: int = _world_renderer.top_z_at(col_x, col_y)
	_column_inspector.show_column(col_x, col_y, top_z)

## Move the camera to the player's projected screen position, offset to the
## center of the tile so the player sprite sits in the middle of the viewport.
func _center_camera_on_player(view: GameView) -> void:
	var player_id_int: int = view.player_id.to_int()
	for entity: ViewEntity in view.entities:
		if entity.id == player_id_int:
			var half_tile: Vector2 = Vector2(Constants.TILE_W, Constants.TOP_FACE_H) * 0.5
			_camera.position = Constants.project(entity.x, entity.y, entity.z) + half_tile
			return
	push_warning("[Main] Player entity (id=%d) not found in view; camera not centered." % player_id_int)
