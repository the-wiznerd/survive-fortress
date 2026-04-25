class_name Spacing
extends Object

## Project spacing scale. Three steps, all multiples of `Constants.UI_PIXEL`
## so spacings stay aligned to the chunky-pixel UI grid.
##
## Use these instead of raw integers when setting separations, paddings, or
## inserting gap controls. If you find yourself wanting a value between two
## of these, prefer rounding to the nearest scale step rather than adding a
## new one — the whole point is consistency.

const XS: int = 4
const SM: int = 8
const MD: int = 12
const LG: int = 20

## Insert a vertical gap of `size` pixels into `parent`.
static func gap_v(parent: Container, size: int) -> Control:
	var spacer: Control = Control.new()
	spacer.custom_minimum_size = Vector2(0, size)
	parent.add_child(spacer)
	return spacer

## Insert a horizontal gap of `size` pixels into `parent`.
static func gap_h(parent: Container, size: int) -> Control:
	var spacer: Control = Control.new()
	spacer.custom_minimum_size = Vector2(size, 0)
	parent.add_child(spacer)
	return spacer
