class_name Text
extends Object

## Project text design system. Six named styles, each with on-dark and
## on-light color variants. Call sites pick a style + context and get a
## fully-themed Label or Button back — no scattered theme-overrides.
##
## Add a new style: bump the enum, add a row to _STYLES, add a one-line
## factory method. That's the whole change.
##
## Sizes: 04b03 (heading) is always 24px; Silkscreen (everything else) is
## always 16px for label/value, 12px for sublabel/subvalue.

## Background context the text will sit on. Picks which color from the style
## table to apply.
enum Ctx {ON_DARK, ON_LIGHT}

## A single semantic style. Bundles font + size + the two color variants.
## Inner class instead of a Dictionary so the table is statically typed and
## doesn't trip the unsafe_method_access warning.
class _Style:
	var use_heading_font: bool
	var size: int
	var on_dark: Color
	var on_light: Color
	func _init(heading: bool, sz: int, dark: Color, light: Color) -> void:
		use_heading_font = heading
		size = sz
		on_dark = dark
		on_light = light

	func font() -> FontFile:
		return Fonts.heading() if use_heading_font else Fonts.base()

	func color(ctx: Ctx) -> Color:
		return on_light if ctx == Ctx.ON_LIGHT else on_dark

# --- The design system. Edit in one place. ---

static var _heading: _Style = _Style.new(true, 24, Palette.LIGHTEST_YELLOW, Palette.DARKEST_YELLOW)
static var _label: _Style = _Style.new(false, 16, Palette.WHITE, Palette.DARKEST_GRAY)
static var _value: _Style = _Style.new(false, 16, Palette.LIGHTEST_GRAY, Palette.DARK_GRAY)
static var _sublabel: _Style = _Style.new(false, 16, Palette.LIGHTEST_GRAY, Palette.GRAY)
static var _subvalue: _Style = _Style.new(false, 16, Palette.GRAY, Palette.GRAY)

# --- Factory methods. One per named style. ---

static func heading(text: String, ctx: Ctx = Ctx.ON_DARK) -> Label:
	return _make_label(_heading, text, ctx)

static func label(text: String, ctx: Ctx = Ctx.ON_DARK) -> Label:
	return _make_label(_label, text, ctx)

static func value(text: String, ctx: Ctx = Ctx.ON_DARK) -> Label:
	return _make_label(_value, text, ctx)

static func sublabel(text: String, ctx: Ctx = Ctx.ON_DARK) -> Label:
	return _make_label(_sublabel, text, ctx)

static func subvalue(text: String, ctx: Ctx = Ctx.ON_DARK) -> Label:
	return _make_label(_subvalue, text, ctx)

static func _make_label(style: _Style, text: String, ctx: Ctx) -> Label:
	var lbl: Label = Label.new()
	lbl.text = text
	lbl.add_theme_font_override("font", style.font())
	lbl.add_theme_font_size_override("font_size", style.size)
	lbl.add_theme_color_override("font_color", style.color(ctx))
	return lbl
