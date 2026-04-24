class_name TerrainPainter
extends RefCounted

## Base class for procedural terrain pixel art. Subclasses paint the base top,
## front, and unknown-top faces into a 16×12 region of an Image; TerrainAtlas
## takes care of compositing the 1px edge borders + corner cutouts on top of
## those base faces to produce the 17 variants per terrain type.
##
## Mirrors TerrainDef in packages/rendering/src/TerrainAtlas.ts.

## Color used for 1px edge borders on top-face variants.
var top_edge_color: Color = Color.MAGENTA
## Color used for 1px edge borders on front-face variants.
var front_edge_color: Color = Color.MAGENTA

## Paint the base top face (no edges) into `image` at offset (x, y).
## Subclasses MUST override.
func paint_top(_image: Image, _x: int, _y: int) -> void:
	push_error("TerrainPainter.paint_top must be overridden")

## Paint the base front face (no edges) into `image` at offset (x, y).
## Subclasses MUST override.
func paint_front(_image: Image, _x: int, _y: int) -> void:
	push_error("TerrainPainter.paint_front must be overridden")

## Paint the "unknown above" top face variant (used in B2 when the column above
## us is outside the player's vertical vision range).
## Subclasses MUST override.
func paint_unknown_top(_image: Image, _x: int, _y: int) -> void:
	push_error("TerrainPainter.paint_unknown_top must be overridden")
