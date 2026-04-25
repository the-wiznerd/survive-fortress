class_name Sidebar
extends CanvasLayer

## Right-side game sidebar. Lives on its own CanvasLayer so it stays in screen
## space regardless of camera movement. Built procedurally in _ready() so the
## scene file stays trivial.
##
## Layout (top → bottom):
##   • Game state  — Day N.TT (tick-of-day padded to two digits)
##   • Player      — health, hunger, equipment slots (Back is clickable)
##   • Feed        — empty placeholder for the action / outcome feed
##   • Settings    — cog button at the bottom
##
## A single update_view() call refreshes every section. Bag clicks emit
## `bag_clicked`; settings clicks emit `settings_clicked`.

const WIDTH: int = 300

const _BG_COLOR: Color = Palette.BLACK
const _DIVIDER_COLOR: Color = Palette.DARKEST_GRAY
const _TEXT_COLOR: Color = Palette.WHITE
const _VALUE_COLOR: Color = Palette.LIGHTEST_GRAY
const _MUTED_COLOR: Color = Palette.LIGHT_GRAY
const _SECTION_HPAD: int = 20
const _SECTION_VPAD: int = 8
const _DIVIDER_HEIGHT: int = Constants.UI_PIXEL

signal bag_clicked
signal settings_clicked

# --- Section widgets we update per-frame ---
var _day_label: Label = null
var _health_value: Label = null
var _hunger_value: Label = null
var _left_hand_value: Label = null
var _right_hand_value: Label = null
var _back_button: Button = null
var _feed_container: VBoxContainer = null

func _ready() -> void:
	# CanvasLayer above the world (default world is layer 0).
	layer = 10
	_build()

func _build() -> void:
	var root: Control = Control.new()
	root.name = "SidebarRoot"
	# Anchor to the right edge, full height.
	root.set_anchors_preset(Control.PRESET_RIGHT_WIDE)
	root.offset_left = - WIDTH
	root.offset_right = 0
	root.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(root)

	var bg: ColorRect = ColorRect.new()
	bg.color = _BG_COLOR
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(bg)

	var col: VBoxContainer = VBoxContainer.new()
	col.set_anchors_preset(Control.PRESET_FULL_RECT)
	col.offset_left = _SECTION_HPAD
	col.offset_right = - _SECTION_HPAD
	col.offset_top = _SECTION_VPAD
	col.offset_bottom = - _SECTION_VPAD
	col.add_theme_constant_override("separation", 0)
	root.add_child(col)

	_build_game_state_section(col)
	_add_divider(col)
	_build_player_section(col)
	_add_divider(col)
	_build_feed_section(col)
	_add_divider(col)
	_build_settings_section(col)

# --- Section builders ---

func _build_game_state_section(parent: VBoxContainer) -> void:
	var box: VBoxContainer = _make_section(parent)
	_day_label = _make_stat_label(box, "Day —")

func _build_player_section(parent: VBoxContainer) -> void:
	# Vitals + equipment live in one section — no heading needed; the player
	# is the implicit subject.
	var box: VBoxContainer = _make_section(parent)
	_health_value = _make_kv_row(box, "Health:", "—")
	_hunger_value = _make_kv_row(box, "Hunger:", "—")
	# Small gap between vitals and slots.
	var gap: Control = Control.new()
	gap.custom_minimum_size = Vector2(0, _SECTION_VPAD)
	box.add_child(gap)
	_left_hand_value = _make_kv_row(box, "Left hand:", "empty")
	_right_hand_value = _make_kv_row(box, "Right hand:", "empty")
	# Back slot is clickable: separate label + button so the value styling
	# matches the other rows but the value remains pressable.
	var back_row: HBoxContainer = HBoxContainer.new()
	back_row.add_theme_constant_override("separation", 6)
	box.add_child(back_row)
	var back_label: Label = Label.new()
	back_label.text = "Back:"
	back_label.add_theme_color_override("font_color", _TEXT_COLOR)
	Fonts.apply_base(back_label)
	back_row.add_child(back_label)
	_back_button = Link.make_on_dark("empty")
	_back_button.disabled = true
	_back_button.alignment = HORIZONTAL_ALIGNMENT_LEFT
	_back_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_back_button.pressed.connect(func() -> void: bag_clicked.emit())
	back_row.add_child(_back_button)

func _build_feed_section(parent: VBoxContainer) -> void:
	# Feed expands to fill remaining vertical space between player section and
	# settings.
	var box: VBoxContainer = VBoxContainer.new()
	box.size_flags_vertical = Control.SIZE_EXPAND_FILL
	box.add_theme_constant_override("separation", 4)
	parent.add_child(box)
	_pad(box)
	box.add_child(_make_heading("Feed"))
	_feed_container = VBoxContainer.new()
	_feed_container.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_feed_container.add_theme_constant_override("separation", 2)
	box.add_child(_feed_container)
	_pad(box)

func _build_settings_section(parent: VBoxContainer) -> void:
	var box: HBoxContainer = HBoxContainer.new()
	parent.add_child(box)
	var spacer: Control = Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	box.add_child(spacer)
	var settings: Button = Link.make_on_dark("⚙")
	settings.pressed.connect(func() -> void: settings_clicked.emit())
	box.add_child(settings)

# --- Updates ---

## Refresh every section from the latest GameView. Safe to call every frame.
func update_view(view: GameView) -> void:
	# Day count starts at 1 to match the canvas client (Day 1.00 on boot).
	var day: int = Utils.divi(view.tick, Constants.TICKS_PER_DAY) + 1
	var tick_in_day: int = Utils.modi(view.tick, Constants.TICKS_PER_DAY)
	_day_label.text = "Day %d.%02d" % [day, tick_in_day]

	var player: ViewEntity = _find_player(view)
	if player == null:
		_health_value.text = "—"
		_hunger_value.text = "—"
		_left_hand_value.text = "empty"
		_right_hand_value.text = "empty"
		_back_button.text = "empty"
		_back_button.disabled = true
		return

	_update_vitals(player)
	_update_slots(player, view)

func _update_vitals(player: ViewEntity) -> void:
	var health: Dictionary = player.get_trait("health")
	if health.is_empty():
		_health_value.text = "—"
	else:
		_health_value.text = "%d/%d" % [
			SdkUtil.to_int(health.get("current", 0)),
			SdkUtil.to_int(health.get("max", 0)),
		]
	var hunger: Dictionary = player.get_trait("hunger")
	if hunger.is_empty():
		_hunger_value.text = "—"
	else:
		_hunger_value.text = "%d/%d" % [
			SdkUtil.to_int(hunger.get("current", 0)),
			SdkUtil.to_int(hunger.get("max", 0)),
		]

func _update_slots(player: ViewEntity, view: GameView) -> void:
	var equipment: Dictionary = player.get_trait("equipment")
	var slots: Dictionary = SdkUtil.to_dict(equipment.get("slots", {}))
	_left_hand_value.text = _slot_text(slots.get("leftHand"), view)
	_right_hand_value.text = _slot_text(slots.get("rightHand"), view)
	var back_id: Variant = slots.get("back")
	_back_button.text = _slot_text(back_id, view)
	_back_button.disabled = back_id == null

func _slot_text(slot_id: Variant, view: GameView) -> String:
	if slot_id == null:
		return "empty"
	var id_int: int = SdkUtil.to_int(slot_id)
	for entity: ViewEntity in view.entities:
		if entity.id == id_int:
			if entity.entity_name != "":
				return entity.entity_name
			return entity.type_name
	return "?"

func _find_player(view: GameView) -> ViewEntity:
	var player_id_int: int = view.player_id.to_int()
	for entity: ViewEntity in view.entities:
		if entity.id == player_id_int:
			return entity
	return null

# --- Builder helpers ---

func _make_section(parent: VBoxContainer) -> VBoxContainer:
	var box: VBoxContainer = VBoxContainer.new()
	box.add_theme_constant_override("separation", 2)
	parent.add_child(box)
	_pad(box)
	return box

func _make_heading(text: String) -> Label:
	var lbl: Label = Label.new()
	lbl.text = text
	lbl.add_theme_color_override("font_color", _MUTED_COLOR)
	Fonts.apply_heading(lbl)
	return lbl

func _make_stat_label(parent: VBoxContainer, text: String) -> Label:
	var lbl: Label = Label.new()
	lbl.text = text
	lbl.add_theme_color_override("font_color", _TEXT_COLOR)
	Fonts.apply_base(lbl)
	parent.add_child(lbl)
	return lbl

## Build a "Label: value" row and return the *value* label so callers can
## update it in place. Label uses the standard text color; value uses the
## lighter VALUE_COLOR so it pops without competing with the section heading.
func _make_kv_row(parent: VBoxContainer, label_text: String, value_text: String) -> Label:
	var row: HBoxContainer = HBoxContainer.new()
	row.add_theme_constant_override("separation", 6)
	parent.add_child(row)
	var lbl: Label = Label.new()
	lbl.text = label_text
	lbl.add_theme_color_override("font_color", _TEXT_COLOR)
	Fonts.apply_base(lbl)
	row.add_child(lbl)
	var val: Label = Label.new()
	val.text = value_text
	val.add_theme_color_override("font_color", _VALUE_COLOR)
	Fonts.apply_base(val)
	row.add_child(val)
	return val

func _add_divider(parent: VBoxContainer) -> void:
	var div: ColorRect = ColorRect.new()
	div.color = _DIVIDER_COLOR
	div.custom_minimum_size = Vector2(0, _DIVIDER_HEIGHT)
	parent.add_child(div)

func _pad(parent: VBoxContainer) -> void:
	var spacer: Control = Control.new()
	spacer.custom_minimum_size = Vector2(0, _SECTION_VPAD)
	parent.add_child(spacer)
