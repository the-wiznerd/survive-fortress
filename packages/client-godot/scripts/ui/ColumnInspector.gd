class_name ColumnInspector
extends CanvasLayer

## Floating panel anchored to a world column. Lives on its own CanvasLayer so
## it overlays the world but sits *below* the right-side Sidebar (sidebar uses
## layer 10).
##
## Positioning: each frame the panel is placed beside the selected tile on the
## side that is *away* from the player (so the popup stays out of the way).
## If the preferred side is clipped by the viewport edge the inspector tries
## the opposite side, then above, then below. Within the chosen side the panel
## is vertically (side placement) or horizontally (above/below placement)
## centred on the tile and clamped so it never leaves the screen.
## A small triangular caret drawn behind the panel points back at the tile.
##
## One-frame layout-lag fix: panel size is read via get_combined_minimum_size()
## rather than size, so the correct dimensions are available on the very first
## frame after content is rebuilt without waiting for a deferred layout pass.

const LAYER: int = 5
const _PANEL_MIN_WIDTH: int = 200
const _PANEL_HPAD: int = 10
const _PANEL_VPAD: int = 8
const _SCREEN_MARGIN: int = 4
## Gap (screen px) between the caret tip and the nearest tile edge.
const _PANEL_GAP: int = 4
## Caret depth — perpendicular to the panel edge (screen px).
const _CARET_W: int = 8
## Caret base length — along the panel edge (screen px).
const _CARET_H: int = 12

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
var _caret: _CaretNode = null

## Which side of the tile the panel currently occupies.
enum _Side { RIGHT, LEFT, ABOVE, BELOW }

## Triangular caret drawn behind the panel to point at the source tile.
## `w` and `h` are the Node2D extents in screen pixels; they are set each
## frame before queue_redraw() so the triangle adapts to horizontal vs.
## vertical orientations without needing a separate class per direction.
class _CaretNode extends Node2D:
	## Caret tip points left  → panel is to the RIGHT of the tile.
	const DIR_LEFT  = 0
	## Caret tip points right → panel is to the LEFT of the tile.
	const DIR_RIGHT = 1
	## Caret tip points up    → panel is BELOW the tile.
	const DIR_UP    = 2
	## Caret tip points down  → panel is ABOVE the tile.
	const DIR_DOWN  = 3

	var fill: Color = Color.WHITE
	var direction: int = DIR_LEFT
	## Extent along the x axis (depth for left/right, base for up/down).
	var w: float = 8.0
	## Extent along the y axis (base for left/right, depth for up/down).
	var h: float = 12.0

	func _ready() -> void:
		z_index = -1

	func _draw() -> void:
		var pts: PackedVector2Array
		match direction:
			DIR_LEFT:   # base on right (x=w), tip on left (x=0)
				pts = PackedVector2Array([
					Vector2(w, 0.0), Vector2(w, h), Vector2(0.0, h * 0.5)
				])
			DIR_RIGHT:  # base on left (x=0), tip on right (x=w)
				pts = PackedVector2Array([
					Vector2(0.0, 0.0), Vector2(0.0, h), Vector2(w, h * 0.5)
				])
			DIR_DOWN:   # base on top (y=0), tip on bottom (y=h)
				pts = PackedVector2Array([
					Vector2(0.0, 0.0), Vector2(w, 0.0), Vector2(w * 0.5, h)
				])
			DIR_UP:     # base on bottom (y=h), tip on top (y=0)
				pts = PackedVector2Array([
					Vector2(0.0, h), Vector2(w, h), Vector2(w * 0.5, 0.0)
				])
		draw_colored_polygon(pts, fill)

func _ready() -> void:
	layer = LAYER
	visible = false
	_build()
	set_process(true)

func _build() -> void:
	# Caret is added first so it renders behind the panel. The panel's opaque
	# background then covers the caret's base, leaving only the triangle tip
	# visible — creating a seamless tooltip-arrow appearance.
	_caret = _CaretNode.new()
	_caret.name = "Caret"
	_caret.fill = _BG_COLOR
	add_child(_caret)

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
		"Harvest (costs %d)" % cost,
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

## Returns the player entity's current screen position, or the viewport centre
## as a fallback when the view is unavailable.
func _get_player_screen_pos() -> Vector2:
	var fallback := get_viewport().get_visible_rect().size * 0.5
	if _view == null:
		return fallback
	var player_id: int = _view.player_id.to_int()
	var xform := get_viewport().get_canvas_transform()
	for e: ViewEntity in _view.entities:
		if e.id == player_id:
			return xform * Constants.project(e.x, e.y, e.z)
	return fallback

## Reposition the panel (and caret) each frame using a side-preference
## algorithm:
##   1. Project the anchored tile to screen space.
##   2. Pick preferred side = opposite of player (panel stays out of the way).
##   3. Try preferred → opposite → above → below; pick first that fits.
##   4. Within the chosen side, centre the panel on the tile and clamp to the
##      viewport margins.
##
## Panel size is read via get_combined_minimum_size() so the correct
## dimensions are available immediately after a content rebuild, eliminating
## the one-frame lag that occurs when reading the deferred .size property.
func _update_anchor_position() -> void:
	var xform    := get_viewport().get_canvas_transform()
	var vp_size  := Vector2(get_viewport().get_visible_rect().size)

	# Tile screen bounds.
	var tile_tl  := xform * Constants.project(_column_x, _column_y, _column_z)
	var zoom     := xform.get_scale()
	var tile_w   := Constants.TILE_W * zoom.x
	var tile_h   := Constants.TOP_FACE_H * zoom.y
	var tile_ctr := tile_tl + Vector2(tile_w * 0.5, tile_h * 0.5)

	# Use get_combined_minimum_size() to avoid one-frame layout lag after
	# _rebuild_entity_list(). For an auto-sized panel (no external stretch)
	# this equals the actual rendered size.
	var ps := _panel.get_combined_minimum_size()
	if ps == Vector2.ZERO:
		ps = _panel.size

	# Side preference: opposite the player so the popup moves away from them.
	var prefer_right := _get_player_screen_pos().x <= tile_ctr.x

	# Total offset from tile edge to near panel edge: caret depth + visual gap.
	var side_off := float(_CARET_W + _PANEL_GAP)
	var m        := float(_SCREEN_MARGIN)

	# ---- Candidate positions ----
	# RIGHT
	var rx := tile_tl.x + tile_w + side_off
	var ry := clampf(tile_ctr.y - ps.y * 0.5, m, vp_size.y - ps.y - m)
	var r_ok := rx + ps.x + m <= vp_size.x

	# LEFT
	var lx := tile_tl.x - ps.x - side_off
	var ly := clampf(tile_ctr.y - ps.y * 0.5, m, vp_size.y - ps.y - m)
	var l_ok := lx >= m

	# ABOVE
	var ay := tile_tl.y - ps.y - side_off
	var ax := clampf(tile_ctr.x - ps.x * 0.5, m, vp_size.x - ps.x - m)
	var a_ok := ay >= m

	# BELOW
	var by := tile_tl.y + tile_h + side_off
	var bx := clampf(tile_ctr.x - ps.x * 0.5, m, vp_size.x - ps.x - m)
	var b_ok := by + ps.y + m <= vp_size.y

	# ---- Pick placement ----
	var pos: Vector2
	var side: int
	if prefer_right:
		if   r_ok: pos = Vector2(rx, ry); side = _Side.RIGHT
		elif l_ok: pos = Vector2(lx, ly); side = _Side.LEFT
		elif a_ok: pos = Vector2(ax, ay); side = _Side.ABOVE
		else:      pos = Vector2(bx, by); side = _Side.BELOW
	else:
		if   l_ok: pos = Vector2(lx, ly); side = _Side.LEFT
		elif r_ok: pos = Vector2(rx, ry); side = _Side.RIGHT
		elif a_ok: pos = Vector2(ax, ay); side = _Side.ABOVE
		else:      pos = Vector2(bx, by); side = _Side.BELOW

	_panel.position = pos
	_update_caret(side, pos, ps, tile_ctr)

## Position and orient the caret triangle so its tip points toward the tile.
## The caret is centred on the tile's screen centre and clamped inside the
## panel bounds so it never overhangs the panel edge.
func _update_caret(side: int, panel_pos: Vector2, panel_size: Vector2, tile_ctr: Vector2) -> void:
	match side:
		_Side.RIGHT:
			# Panel is right of tile → caret on panel's left edge, tip left.
			_caret.direction = _CaretNode.DIR_LEFT
			_caret.w = _CARET_W
			_caret.h = _CARET_H
			var cy := clampf(
				tile_ctr.y - _CARET_H * 0.5,
				panel_pos.y, maxf(panel_pos.y, panel_pos.y + panel_size.y - _CARET_H)
			)
			_caret.position = Vector2(panel_pos.x - _CARET_W, cy)
		_Side.LEFT:
			# Panel is left of tile → caret on panel's right edge, tip right.
			_caret.direction = _CaretNode.DIR_RIGHT
			_caret.w = _CARET_W
			_caret.h = _CARET_H
			var cy := clampf(
				tile_ctr.y - _CARET_H * 0.5,
				panel_pos.y, maxf(panel_pos.y, panel_pos.y + panel_size.y - _CARET_H)
			)
			_caret.position = Vector2(panel_pos.x + panel_size.x, cy)
		_Side.ABOVE:
			# Panel is above tile → caret on panel's bottom edge, tip down.
			_caret.direction = _CaretNode.DIR_DOWN
			_caret.w = _CARET_H   # horizontal extent = base length
			_caret.h = _CARET_W   # vertical extent   = depth
			var cx := clampf(
				tile_ctr.x - _CARET_H * 0.5,
				panel_pos.x, maxf(panel_pos.x, panel_pos.x + panel_size.x - _CARET_H)
			)
			_caret.position = Vector2(cx, panel_pos.y + panel_size.y)
		_Side.BELOW:
			# Panel is below tile → caret on panel's top edge, tip up.
			_caret.direction = _CaretNode.DIR_UP
			_caret.w = _CARET_H
			_caret.h = _CARET_W
			var cx := clampf(
				tile_ctr.x - _CARET_H * 0.5,
				panel_pos.x, maxf(panel_pos.x, panel_pos.x + panel_size.x - _CARET_H)
			)
			_caret.position = Vector2(cx, panel_pos.y - _CARET_W)
	_caret.queue_redraw()
