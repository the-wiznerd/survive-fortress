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
	col.offset_left = Spacing.LG
	col.offset_right = - Spacing.LG
	col.offset_top = Spacing.LG
	col.offset_bottom = - Spacing.SM
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
	_day_label = Text.heading("Day —")
	box.add_child(_day_label)

func _build_player_section(parent: VBoxContainer) -> void:
	# Vitals + equipment under a "Player" heading.
	var box: VBoxContainer = _make_section(parent)
	box.add_child(_make_heading("Player"))
	_health_value = _make_kv_row(box, "Health:", "—")
	_hunger_value = _make_kv_row(box, "Hunger:", "—")

	# Equipment subgroup: own sub-heading, slots indented one MD step under it
	# and styled as sublabel/subvalue so they read as a tier below vitals.
	box.add_child(Text.label("Equipment:"))
	_left_hand_value = _make_sub_kv_row(box, "Left hand:", "-")
	_right_hand_value = _make_sub_kv_row(box, "Right hand:", "-")

	# Back slot is clickable: separate label + button so the value styling
	# matches the other rows but the value remains pressable.
	var back_row: HBoxContainer = HBoxContainer.new()
	back_row.add_theme_constant_override("separation", Spacing.SM)
	box.add_child(back_row)
	Spacing.gap_h(back_row, Spacing.SM)
	back_row.add_child(Text.sublabel("Back:"))
	_back_button = Link.make("empty")
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
	box.add_theme_constant_override("separation", Spacing.XS)
	parent.add_child(box)
	box.add_child(Text.heading("Feed"))
	_feed_container = VBoxContainer.new()
	_feed_container.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_feed_container.add_theme_constant_override("separation", Spacing.XS)
	box.add_child(_feed_container)

func _build_settings_section(parent: VBoxContainer) -> void:
	var box: HBoxContainer = HBoxContainer.new()
	parent.add_child(box)
	var spacer: Control = Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	box.add_child(spacer)
	var settings: Button = Link.make("⚙")
	settings.pressed.connect(func() -> void: settings_clicked.emit())
	box.add_child(settings)

# --- Updates ---

## Refresh every section from the latest GameView. Safe to call every frame.
func update_view(view: GameView) -> void:
	# Day count starts at 1 to match the canvas client (Day 1.00 on boot).
	var day: int = Utils.divi(view.tick, Constants.TICKS_PER_DAY) + 1
	var tick_in_day: int = Utils.modi(view.tick, Constants.TICKS_PER_DAY)
	Text.set_text(_day_label, "Day %d.%02d" % [day, tick_in_day])

	var player: ViewEntity = _find_player(view)
	if player == null:
		Text.set_text(_health_value, "—")
		Text.set_text(_hunger_value, "—")
		Text.set_text(_left_hand_value, "empty")
		Text.set_text(_right_hand_value, "empty")
		Text.set_text(_back_button, "empty")
		_back_button.disabled = true
		return

	_update_vitals(player)
	_update_slots(player, view)

func _update_vitals(player: ViewEntity) -> void:
	var health: Dictionary = player.get_trait("health")
	if health.is_empty():
		Text.set_text(_health_value, "—")
	else:
		Text.set_text(_health_value, "%d/%d" % [
			SdkUtil.to_int(health.get("current", 0)),
			SdkUtil.to_int(health.get("max", 0)),
		])
	var hunger: Dictionary = player.get_trait("hunger")
	if hunger.is_empty():
		Text.set_text(_hunger_value, "—")
	else:
		Text.set_text(_hunger_value, "%d/%d" % [
			SdkUtil.to_int(hunger.get("current", 0)),
			SdkUtil.to_int(hunger.get("max", 0)),
		])

func _update_slots(player: ViewEntity, view: GameView) -> void:
	var equipment: Dictionary = player.get_trait("equipment")
	var slots: Dictionary = SdkUtil.to_dict(equipment.get("slots", {}))
	Text.set_text(_left_hand_value, _slot_text(slots.get("leftHand"), view))
	Text.set_text(_right_hand_value, _slot_text(slots.get("rightHand"), view))
	var back_id: Variant = slots.get("back")
	Text.set_text(_back_button, _slot_text(back_id, view))
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
	box.add_theme_constant_override("separation", Spacing.XS)
	parent.add_child(box)
	return box

func _make_heading(text: String) -> Label:
	return Text.heading(text)

## Build a "Label: value" row and return the *value* label so callers can
## update it in place.
func _make_kv_row(parent: VBoxContainer, label_text: String, value_text: String) -> Label:
	var row: HBoxContainer = HBoxContainer.new()
	row.add_theme_constant_override("separation", Spacing.SM)
	parent.add_child(row)
	row.add_child(Text.label(label_text))
	var val: Label = Text.value(value_text)
	row.add_child(val)
	return val

## Like `_make_kv_row` but uses the smaller sublabel/subvalue text styles and
## indents the row one MD step. Used for sub-grouped data (e.g. equipment
## slots under the EQUIPMENT sub-heading) so the visual hierarchy reads as
## one tier below the section's primary stats.
func _make_sub_kv_row(parent: VBoxContainer, label_text: String, value_text: String) -> Label:
	var row: HBoxContainer = HBoxContainer.new()
	row.add_theme_constant_override("separation", Spacing.SM)
	parent.add_child(row)
	Spacing.gap_h(row, Spacing.SM)
	row.add_child(Text.sublabel(label_text))
	var val: Label = Text.subvalue(value_text)
	row.add_child(val)
	return val

## A section separator: MD space, 1px line, MD space. The padding is part of
## the separator itself so section builders don't have to remember to add
## breathing room before/after.
func _add_divider(parent: VBoxContainer) -> void:
	Spacing.gap_v(parent, Spacing.SM)
	var div: ColorRect = ColorRect.new()
	div.color = _DIVIDER_COLOR
	div.custom_minimum_size = Vector2(0, _DIVIDER_HEIGHT)
	parent.add_child(div)
	Spacing.gap_v(parent, Spacing.SM + 3)
