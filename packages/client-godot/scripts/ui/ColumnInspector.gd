class_name ColumnInspector
extends CanvasLayer

## Floating panel anchored to a world column. Lives on its own CanvasLayer so
## it overlays the world but sits *below* the right-side Sidebar (sidebar uses
## layer 10).
##
## Scope of this first pass: chrome + position tracking only. The panel shows
## the column coordinates and a close button. Per-entity content (cards, chips,
## equipment) lands in a follow-up.
##
## Anchoring: the inspector is told a world (x, y, z). Each frame in _process
## we project that world position to screen space via the viewport's canvas
## transform (which already encodes the active Camera2D's pan + zoom) and
## reposition the panel. This is the Godot equivalent of the canvas client's
## DOM-overlay-with-floating-ui approach.

const LAYER: int = 5
const _PANEL_MIN_WIDTH: int = 200
const _PANEL_HPAD: int = 10
const _PANEL_VPAD: int = 8
const _ANCHOR_OFFSET: Vector2 = Vector2(8, -8)
const _SCREEN_MARGIN: int = 4

const _BG_COLOR: Color = Palette.WHITE
const _BORDER_COLOR: Color = Palette.DARKEST_GRAY
const _DIVIDER_COLOR: Color = Palette.LIGHTEST_GRAY
const _DIVIDER_PAD: int = 8
const _TITLE_COLOR: Color = Palette.BLACK
const _LABEL_COLOR: Color = Palette.DARKEST_GRAY
const _VALUE_COLOR: Color = Palette.BLACK
const _MUTED_COLOR: Color = Palette.DARK_GRAY

signal closed
## Emitted when the user clicks an action button inside an entity card (e.g.
## the bush "Harvest" button). The receiver is responsible for queuing the
## action and sending it to the server.
signal action_requested(action: PlayerAction)

# --- Anchoring state ---
var _column_x: int = 0
var _column_y: int = 0
var _column_z: int = 0
var _anchored: bool = false
## Latest GameView, kept so the entity list can be rebuilt when the view
## updates (round resolve) without the caller needing to know whether the
## inspector is open.
var _view: GameView = null

# --- Widgets ---
var _panel: PanelContainer = null
var _entity_list: VBoxContainer = null
var _empty_label: Label = null

func _ready() -> void:
	layer = LAYER
	visible = false
	_build()
	set_process(true)

func _build() -> void:
	_panel = PanelContainer.new()
	_panel.name = "InspectorPanel"
	_panel.custom_minimum_size = Vector2(_PANEL_MIN_WIDTH, 0)
	_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	# Background only — no border. Each corner has a square 2 game-pixel
	# chunk knocked out (NotchedStyleBox draws a "+"-shaped fill, no
	# anti-aliasing).
	var sb: NotchedStyleBox = NotchedStyleBox.new()
	sb.bg_color = _BG_COLOR
	sb.notch_size = 2 * Constants.UI_PIXEL
	sb.content_margin_left = _PANEL_HPAD
	sb.content_margin_right = _PANEL_HPAD
	sb.content_margin_top = _PANEL_VPAD
	sb.content_margin_bottom = _PANEL_VPAD
	_panel.add_theme_stylebox_override("panel", sb)
	add_child(_panel)

	var col: VBoxContainer = VBoxContainer.new()
	col.add_theme_constant_override("separation", 0)
	_panel.add_child(col)

	# Header: just a close button, right-aligned. No title — coordinates aren't
	# meaningful to the player and there's nothing else worth saying here yet.
	var header: HBoxContainer = HBoxContainer.new()
	col.add_child(header)
	var header_spacer: Control = Control.new()
	header_spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(header_spacer)
	var close_btn: Button = Link.make_on_light("close")
	close_btn.pressed.connect(_on_close_pressed)
	header.add_child(close_btn)

	# Body: one entity card per entity in the column, separated by 1px
	# dividers. Rebuilt every refresh.
	_entity_list = VBoxContainer.new()
	_entity_list.add_theme_constant_override("separation", 0)
	col.add_child(_entity_list)
	_empty_label = Label.new()
	_empty_label.text = "Empty"
	_empty_label.add_theme_color_override("font_color", _MUTED_COLOR)
	Fonts.apply_base(_empty_label)
	col.add_child(_empty_label)

## Open the inspector on a world column. `z` is the topmost terrain z (used
## for vertical anchoring above the stack); -1 means "ground level".
func show_column(x: int, y: int, z: int) -> void:
	_column_x = x
	_column_y = y
	_column_z = max(z, 0)
	_anchored = true
	visible = true
	_rebuild_entity_list()
	_update_anchor_position()

## Push the latest world view in. Safe to call every frame; rebuilds the
## entity list only when the inspector is open.
func set_view(view: GameView) -> void:
	_view = view
	if _anchored:
		_rebuild_entity_list()

## Close the inspector and forget the anchor. Idempotent.
func close() -> void:
	if not _anchored and not visible:
		return
	_anchored = false
	visible = false
	closed.emit()

func is_open() -> bool:
	return _anchored

func anchored_column() -> Vector2i:
	return Vector2i(_column_x, _column_y)

func _on_close_pressed() -> void:
	close()

## Repopulate the entity-card list from `_view` filtered to the anchored
## column. Entities live inside containers (the `contained` trait) are
## excluded; the rest are sorted top-to-bottom (highest z first) so the card
## order matches what the player sees on screen. A 1px divider sits between
## adjacent cards (no leading/trailing divider).
func _rebuild_entity_list() -> void:
	# Detach synchronously (queue_free is deferred — without remove_child the
	# old rows would still be in the tree when we add new ones, causing the
	# panel to grow with every refresh).
	for child in _entity_list.get_children():
		_entity_list.remove_child(child)
		child.queue_free()
	var entities: Array[ViewEntity] = _entities_in_column()
	_empty_label.visible = entities.is_empty()
	for i in entities.size():
		if i > 0:
			_entity_list.add_child(_make_divider())
		_entity_list.add_child(_make_entity_card(entities[i]))
	# Containers remember their previous size; without a reset the panel only
	# ever grows. reset_size() snaps it back to the new combined min size.
	_panel.reset_size()

func _entities_in_column() -> Array[ViewEntity]:
	var out: Array[ViewEntity] = []
	if _view == null:
		return out
	var player_id: int = _view.player_id.to_int()
	for entity: ViewEntity in _view.entities:
		if entity.x != _column_x or entity.y != _column_y:
			continue
		if entity.has_trait("contained"):
			continue
		# Skip the local player — their stats live in the sidebar already, no
		# need to repeat them in the column inspector.
		if entity.id == player_id:
			continue
		out.append(entity)
	out.sort_custom(func(a: ViewEntity, b: ViewEntity) -> bool: return a.z > b.z)
	return out

## One card per entity: title row at the top, then per-type body rows. The
## body is hand-rolled per entity type rather than driven by a generic trait
## walker — different types want different curated info, and a per-type
## function keeps the data choices explicit and reviewable.
func _make_entity_card(entity: ViewEntity) -> Control:
	var card: VBoxContainer = VBoxContainer.new()
	card.add_theme_constant_override("separation", 2)
	var title: Label = Label.new()
	title.text = _label_for(entity)
	title.add_theme_color_override("font_color", _TITLE_COLOR)
	Fonts.apply_base(title)
	card.add_child(title)
	for row in _body_rows_for(entity):
		card.add_child(row)
	return card

## Dispatch on entity type to produce the body rows. Unknown types render
## just the title.
func _body_rows_for(entity: ViewEntity) -> Array[Control]:
	match entity.type_name:
		"dirt":
			return _dirt_rows(entity)
		"water":
			return _water_rows(entity)
		"bush":
			return _bush_rows(entity)
		# sand and stone intentionally show only their title.
		_:
			return [] as Array[Control]

func _dirt_rows(entity: ViewEntity) -> Array[Control]:
	var rows: Array[Control] = _moisture_rows(entity)
	# Ground cover only worth surfacing when something is growing there.
	var ground_cover: Dictionary = entity.get_trait("groundCover")
	var cover: String = SdkUtil.to_string_or(ground_cover.get("cover", ""))
	if cover != "":
		rows.append(_make_kv_row("Ground cover", cover))
	return rows

func _water_rows(entity: ViewEntity) -> Array[Control]:
	return _moisture_rows(entity)

func _moisture_rows(entity: ViewEntity) -> Array[Control]:
	var rows: Array[Control] = []
	var moisture: Dictionary = entity.get_trait("moisture")
	if moisture.is_empty():
		return rows
	var current: int = SdkUtil.to_int(moisture.get("current", 0))
	var capacity: int = SdkUtil.to_int(moisture.get("capacity", 0))
	rows.append(_make_kv_row("Moisture", "%d/%d" % [current, capacity]))
	return rows

func _bush_rows(entity: ViewEntity) -> Array[Control]:
	var rows: Array[Control] = []
	var harvestable: Dictionary = entity.get_trait("harvestable")
	if harvestable.is_empty():
		return rows
	var available: bool = SdkUtil.to_bool(harvestable.get("available", false))
	if not available:
		return rows
	var cost: int = SdkUtil.to_int(harvestable.get("cost", 0))
	rows.append(_make_action_button(
		"harvest  %d%s" % [cost, Fonts.ICON_AP],
		PlayerAction.harvest(entity.id),
	))
	return rows

## A simple "key: value" row, no indentation. Used by per-type renderers to
## surface curated stats under the entity title.
func _make_kv_row(key: String, value_text: String) -> Control:
	var row: HBoxContainer = HBoxContainer.new()
	row.add_theme_constant_override("separation", 6)
	var key_lbl: Label = Label.new()
	key_lbl.text = "%s:" % key
	key_lbl.add_theme_color_override("font_color", _LABEL_COLOR)
	Fonts.apply_base(key_lbl)
	row.add_child(key_lbl)
	var value_lbl: Label = Label.new()
	value_lbl.text = value_text
	value_lbl.add_theme_color_override("font_color", _VALUE_COLOR)
	Fonts.apply_base(value_lbl)
	row.add_child(value_lbl)
	return row

## A clickable action row, rendered as a link. The action is captured by
## value (PlayerAction is a RefCounted) and emitted back through
## `action_requested` on click.
func _make_action_button(label_text: String, action: PlayerAction) -> Control:
	var btn: Button = Link.make_on_light(label_text)
	btn.pressed.connect(func() -> void: action_requested.emit(action))
	# Wrap in an HBox so the link sits left-aligned instead of stretching.
	var row: HBoxContainer = HBoxContainer.new()
	row.add_child(btn)
	var spacer: Control = Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(spacer)
	return row

func _make_divider() -> Control:
	# Vertical padding above + UI-pixel line + vertical padding below, so
	# adjacent cards aren't crammed against the divider.
	var wrap: VBoxContainer = VBoxContainer.new()
	wrap.add_theme_constant_override("separation", 0)
	var pad_top: Control = Control.new()
	pad_top.custom_minimum_size = Vector2(0, _DIVIDER_PAD)
	wrap.add_child(pad_top)
	var line: ColorRect = ColorRect.new()
	line.color = _DIVIDER_COLOR
	line.custom_minimum_size = Vector2(0, Constants.UI_PIXEL)
	wrap.add_child(line)
	var pad_bot: Control = Control.new()
	pad_bot.custom_minimum_size = Vector2(0, _DIVIDER_PAD)
	wrap.add_child(pad_bot)
	return wrap

func _label_for(entity: ViewEntity) -> String:
	if entity.entity_name != "":
		return "%s (%s)" % [entity.entity_name, _capitalize(entity.type_name)]
	return _capitalize(entity.type_name)

func _capitalize(s: String) -> String:
	if s.is_empty():
		return s
	return s.substr(0, 1).to_upper() + s.substr(1)

func _process(_delta: float) -> void:
	if _anchored and visible:
		_update_anchor_position()

func _update_anchor_position() -> void:
	# CanvasLayer children are NOT auto-transformed by the active Camera2D,
	# so we apply the viewport's canvas transform manually to convert from
	# world space to screen space.
	var world_pos: Vector2 = Constants.project(_column_x, _column_y, _column_z)
	var screen_pos: Vector2 = get_viewport().get_canvas_transform() * world_pos
	# Anchor to the upper-right corner of the column (offset diagonally so the
	# panel sits beside the tile, not on top of it).
	var target: Vector2 = screen_pos + _ANCHOR_OFFSET
	# Clamp into the visible viewport so the panel never disappears off-screen.
	var viewport_size: Vector2 = Vector2(get_viewport().get_visible_rect().size)
	var panel_size: Vector2 = _panel.size
	if panel_size == Vector2.ZERO:
		panel_size = _panel.get_combined_minimum_size()
	target.x = clamp(target.x, _SCREEN_MARGIN, viewport_size.x - panel_size.x - _SCREEN_MARGIN)
	target.y = clamp(target.y, _SCREEN_MARGIN, viewport_size.y - panel_size.y - _SCREEN_MARGIN)
	_panel.position = target
