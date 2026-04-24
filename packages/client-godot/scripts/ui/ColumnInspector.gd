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
const _PANEL_MIN_WIDTH: int = 180
const _PANEL_HPAD: int = 8
const _PANEL_VPAD: int = 6
const _ANCHOR_OFFSET: Vector2 = Vector2(8, -8)
const _SCREEN_MARGIN: int = 4

const _BG_COLOR: Color = Palette.BLACK
const _BORDER_COLOR: Color = Palette.DARKEST_GRAY
const _TEXT_COLOR: Color = Palette.WHITE
const _MUTED_COLOR: Color = Palette.LIGHT_GRAY

signal closed

# --- Anchoring state ---
var _column_x: int = 0
var _column_y: int = 0
var _column_z: int = 0
var _anchored: bool = false

# --- Widgets ---
var _panel: PanelContainer = null
var _title_label: Label = null

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
	# Background + border via a StyleBoxFlat applied to the PanelContainer's
	# `panel` slot.
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	sb.bg_color = _BG_COLOR
	sb.border_color = _BORDER_COLOR
	sb.set_border_width_all(2)
	sb.content_margin_left = _PANEL_HPAD
	sb.content_margin_right = _PANEL_HPAD
	sb.content_margin_top = _PANEL_VPAD
	sb.content_margin_bottom = _PANEL_VPAD
	_panel.add_theme_stylebox_override("panel", sb)
	add_child(_panel)

	var col: VBoxContainer = VBoxContainer.new()
	col.add_theme_constant_override("separation", 4)
	_panel.add_child(col)

	# Header: title + close button on one row.
	var header: HBoxContainer = HBoxContainer.new()
	header.add_theme_constant_override("separation", 6)
	col.add_child(header)
	_title_label = Label.new()
	_title_label.text = "Column"
	_title_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_title_label.add_theme_color_override("font_color", _TEXT_COLOR)
	Fonts.apply_base(_title_label)
	header.add_child(_title_label)
	var close_btn: Button = Button.new()
	close_btn.text = "x"
	close_btn.flat = true
	close_btn.add_theme_color_override("font_color", _MUTED_COLOR)
	Fonts.apply_base(close_btn)
	close_btn.pressed.connect(_on_close_pressed)
	header.add_child(close_btn)

## Open the inspector on a world column. `z` is the topmost terrain z (used
## for vertical anchoring above the stack); -1 means "ground level".
func show_column(x: int, y: int, z: int) -> void:
	_column_x = x
	_column_y = y
	_column_z = max(z, 0)
	_anchored = true
	visible = true
	_title_label.text = "Column (%d, %d)" % [x, y]
	_update_anchor_position()

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
