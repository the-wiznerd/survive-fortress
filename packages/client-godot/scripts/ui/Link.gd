class_name Link
extends Object

## Factory for "link"-styled buttons. A link is a flat Button with no chrome,
## sized to its text, that uses a blue text-link palette and a pointing-hand
## cursor on hover.
##
## Two variants for our two backdrops:
##   • Link.make_on_dark(text)  — for the BLACK sidebar / dark surfaces.
##     LIGHTEST_BLUE → LIGHT_BLUE on hover.
##   • Link.make_on_light(text) — for the WHITE inspector / light surfaces.
##     BLUE → DARK_BLUE on hover.
##
## Lives as a static factory rather than a scene/class so callers stay in
## charge of parenting and signal wiring — same shape as the rest of the UI
## builders.

const _DISABLED_COLOR: Color = Palette.DARK_GRAY

# On dark backgrounds (sidebar): light blue idle, lighter blue on hover.
const _DARK_BG_COLOR: Color = Palette.LIGHTEST_BLUE
const _DARK_BG_HOVER_COLOR: Color = Palette.LIGHT_BLUE
const _DARK_BG_PRESSED_COLOR: Color = Palette.BLUE

# On light backgrounds (inspector): mid blue idle, dark blue on hover.
const _LIGHT_BG_COLOR: Color = Palette.BLUE
const _LIGHT_BG_HOVER_COLOR: Color = Palette.DARK_BLUE
const _LIGHT_BG_PRESSED_COLOR: Color = Palette.DARKEST_BLUE

static func make_on_dark(text: String) -> Button:
	return _make(text, _DARK_BG_COLOR, _DARK_BG_HOVER_COLOR, _DARK_BG_PRESSED_COLOR)

static func make_on_light(text: String) -> Button:
	return _make(text, _LIGHT_BG_COLOR, _LIGHT_BG_HOVER_COLOR, _LIGHT_BG_PRESSED_COLOR)

static func _make(text: String, idle: Color, hover: Color, pressed: Color) -> Button:
	var btn: Button = Button.new()
	btn.text = text
	btn.flat = true
	btn.focus_mode = Control.FOCUS_NONE
	btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	btn.add_theme_color_override("font_color", idle)
	btn.add_theme_color_override("font_hover_color", hover)
	btn.add_theme_color_override("font_pressed_color", pressed)
	btn.add_theme_color_override("font_hover_pressed_color", hover)
	btn.add_theme_color_override("font_disabled_color", _DISABLED_COLOR)
	# Strip the default Button chrome so the text reads as inline link text.
	var empty: StyleBoxEmpty = StyleBoxEmpty.new()
	btn.add_theme_stylebox_override("normal", empty)
	btn.add_theme_stylebox_override("hover", empty)
	btn.add_theme_stylebox_override("pressed", empty)
	btn.add_theme_stylebox_override("focus", empty)
	btn.add_theme_stylebox_override("disabled", empty)
	Fonts.apply_base(btn)
	return btn
