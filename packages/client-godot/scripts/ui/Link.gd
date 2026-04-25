class_name Link
extends Object

## Factory for "link"-styled buttons. A link is a flat Button with no chrome,
## sized to its text, that uses a blue text-link palette and a pointing-hand
## cursor on hover.
##
## Usage:
##   Link.make("close", Text.Ctx.ON_LIGHT)
##   Link.make("⚙", Text.Ctx.ON_DARK)
##
## Default ctx is ON_DARK to match the dominant sidebar surface.

const _DISABLED_COLOR: Color = Palette.DARK_GRAY

# On dark backgrounds (sidebar): light blue idle, lighter blue on hover.
const _ON_DARK_IDLE: Color = Palette.LIGHTEST_BLUE
const _ON_DARK_HOVER: Color = Palette.LIGHT_BLUE
const _ON_DARK_PRESSED: Color = Palette.BLUE

# On light backgrounds (inspector): mid blue idle, dark blue on hover.
const _ON_LIGHT_IDLE: Color = Palette.BLUE
const _ON_LIGHT_HOVER: Color = Palette.DARK_BLUE
const _ON_LIGHT_PRESSED: Color = Palette.DARKEST_BLUE

static func make(text: String, ctx: Text.Ctx = Text.Ctx.ON_DARK) -> Button:
	if ctx == Text.Ctx.ON_LIGHT:
		return _make(text, _ON_LIGHT_IDLE, _ON_LIGHT_HOVER, _ON_LIGHT_PRESSED)
	return _make(text, _ON_DARK_IDLE, _ON_DARK_HOVER, _ON_DARK_PRESSED)

static func _make(text: String, idle: Color, hover: Color, pressed: Color) -> Button:
	var btn: Button = Button.new()
	btn.text = text.to_upper()
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
