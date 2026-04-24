class_name Fonts
extends Object

## Pixel font palette. Loaded once and shared across all UI. Use BASE for body
## text (Silkscreen, slightly larger, easier to read) and HEADING for tighter
## chrome / labels (04b03 — extremely small pixel font).
##
## Sizes are picked to render crisply at 1× CanvasLayer scale. Bump them up in
## multiples (8 → 16, 16 → 32) if you want larger text without aliasing.

const BASE_PATH: String = "res://assets/fonts/Silkscreen/Silkscreen-Regular.ttf"
const BASE_BOLD_PATH: String = "res://assets/fonts/Silkscreen/Silkscreen-Bold.ttf"
const HEADING_PATH: String = "res://assets/fonts/04b03/04b03.ttf"

const BASE_SIZE: int = 16
const HEADING_SIZE: int = 16

static var _base: FontFile = null
static var _base_bold: FontFile = null
static var _heading: FontFile = null

static func base() -> FontFile:
	if _base == null:
		_base = load(BASE_PATH) as FontFile
	return _base

static func base_bold() -> FontFile:
	if _base_bold == null:
		_base_bold = load(BASE_BOLD_PATH) as FontFile
	return _base_bold

static func heading() -> FontFile:
	if _heading == null:
		_heading = load(HEADING_PATH) as FontFile
	return _heading

## Apply BASE font + size to a Control's font theme overrides. Works on Label,
## Button, RichTextLabel and any other Control that uses the standard `font`
## and `font_size` theme entries.
static func apply_base(ctrl: Control, size: int = BASE_SIZE) -> void:
	ctrl.add_theme_font_override("font", base())
	ctrl.add_theme_font_size_override("font_size", size)

static func apply_base_bold(ctrl: Control, size: int = BASE_SIZE) -> void:
	ctrl.add_theme_font_override("font", base_bold())
	ctrl.add_theme_font_size_override("font_size", size)

static func apply_heading(ctrl: Control, size: int = HEADING_SIZE) -> void:
	ctrl.add_theme_font_override("font", heading())
	ctrl.add_theme_font_size_override("font_size", size)
