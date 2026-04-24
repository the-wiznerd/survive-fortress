class_name GameConnection
extends Node

## Thin WebSocket wrapper around the survive-fortress server.
## Polls in _process(), parses incoming JSON into typed ServerMessage objects,
## and emits one signal per message variant for ergonomic consumption.

signal connected
signal disconnected(close_code: int, close_reason: String)
signal connection_error(message: String)

# Typed server-message signals -------------------------------------------------
signal joined(message: ServerMessage)
signal round_resolve(message: ServerMessage)
signal server_error(message: String)
## Catch-all for messages we couldn't dispatch (unknown type, parse failure).
signal unknown_message(raw: Dictionary)

var _socket: WebSocketPeer = WebSocketPeer.new()
var _state: int = WebSocketPeer.STATE_CLOSED
var _url: String = ""

## Buffer sizes must be set BEFORE connect_to_url(). The default 64 KB is too
## small for joined-world frames once worlds get nontrivial.
const INBOUND_BUFFER_SIZE: int = 8 * 1024 * 1024
const OUTBOUND_BUFFER_SIZE: int = 1 * 1024 * 1024
const MAX_QUEUED_PACKETS: int = 2048

func connect_to_server(url: String) -> void:
	_url = url
	_socket.inbound_buffer_size = INBOUND_BUFFER_SIZE
	_socket.outbound_buffer_size = OUTBOUND_BUFFER_SIZE
	_socket.max_queued_packets = MAX_QUEUED_PACKETS
	var err: int = _socket.connect_to_url(url)
	if err != OK:
		var msg: String = "Failed to initiate WebSocket connection to %s (error %d)" % [url, err]
		push_error(msg)
		connection_error.emit(msg)

func close() -> void:
	_socket.close()

func is_open() -> bool:
	return _socket.get_ready_state() == WebSocketPeer.STATE_OPEN

## Send a raw dictionary as JSON. Prefer the typed helpers below.
func send(data: Dictionary) -> void:
	if _socket.get_ready_state() != WebSocketPeer.STATE_OPEN:
		push_error("GameConnection.send(): socket not open")
		return
	var payload: String = JSON.stringify(data)
	var err: int = _socket.send_text(payload)
	if err != OK:
		push_error("GameConnection.send(): send_text failed (error %d)" % err)

## Send a `join` message. `turn_mode` is "manual" or "auto"; "" omits it.
func send_join(save: String, turn_mode: String = "") -> void:
	var msg: Dictionary = {"type": "join", "save": save}
	if turn_mode != "":
		msg["turnMode"] = turn_mode
	send(msg)

## Send a `submit-plan` message with a list of typed PlayerActions.
func send_plan(actions: Array[PlayerAction]) -> void:
	var serialized: Array = []
	for action in actions:
		serialized.append(action.to_dict())
	send({"type": "submit-plan", "actions": serialized})

func _process(_delta: float) -> void:
	_socket.poll()
	var new_state: int = _socket.get_ready_state()
	if new_state != _state:
		_state = new_state
		match _state:
			WebSocketPeer.STATE_OPEN:
				print("[GameConnection] Connected to ", _url)
				connected.emit()
			WebSocketPeer.STATE_CLOSED:
				var code: int = _socket.get_close_code()
				var reason: String = _socket.get_close_reason()
				print("[GameConnection] Disconnected (code=%d reason=%s)" % [code, reason])
				disconnected.emit(code, reason)
	if _state == WebSocketPeer.STATE_OPEN:
		while _socket.get_available_packet_count() > 0:
			_handle_packet()

func _handle_packet() -> void:
	var raw: String = _socket.get_packet().get_string_from_utf8()
	var parsed: Variant = JSON.parse_string(raw)
	if not (parsed is Dictionary):
		push_error("[GameConnection] Received non-object frame: %s" % raw)
		return
	var frame: Dictionary = SdkUtil.to_dict(parsed)
	var msg: ServerMessage = ServerMessage.from_dict(frame)
	match msg.type:
		ServerMessage.TYPE_JOINED:
			joined.emit(msg)
		ServerMessage.TYPE_ROUND_RESOLVE:
			round_resolve.emit(msg)
		ServerMessage.TYPE_ERROR:
			server_error.emit(msg.error_message)
		_:
			unknown_message.emit(frame)
