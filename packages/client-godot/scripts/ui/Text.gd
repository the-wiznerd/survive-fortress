class_name Text
extends Object

## Typography mixins. Each factory builds a Label with the project's font,
## size, and a color baked in — so call sites read like `Text.body("foo",
## Palette.WHITE)` instead of four lines of theme-override boilerplate.
##
## Color is required (no implicit default) because every site already lives
## on either a black sidebar or a white inspector and the right color is
## context-dependent. If you find yourself repeating the same color a lot,
## promote it to a const on the calling class (see Sidebar._TEXT_COLOR etc.).

## Body text: Silkscreen at base size. Use for stats, labels, values, button
## text, anything that isn't a section title.
static func body(text: String, color: Color) -> Label:
	var label: Label = Label.new()
	label.text = text
	label.add_theme_color_override("font_color", color)
	Fonts.apply_base(label)
	return label

## Heading text: 04b03 at heading size. Use for section titles (Player, Feed)
## and prominent state (Day, entity card titles).
static func heading(text: String, color: Color) -> Label:
	var label: Label = Label.new()
	label.text = text
	label.add_theme_color_override("font_color", color)
	Fonts.apply_heading(label)
	return label
