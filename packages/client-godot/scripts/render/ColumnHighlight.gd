class_name ColumnHighlight
extends Node2D

## Flat top-face overlay sprite drawn on top of the inspected column, used by
## the column inspector to make it obvious which tile the floating panel
## refers to.
##
## Mounted as a child of WorldRenderer so it participates in the same Y-sort
## tree as terrain and entities. Position carries the row sort key (no z); a
## visual child carries the elevation offset. z_index is set to the topmost
## terrain z so the overlay paints above terrain in the same row but stays
## *under* taller entities (the player, trees, etc.) standing on the column,
## matching the legacy canvas renderer's "after terrain, before entities"
## ordering.

## Sprite sheet row holding hover/selected/arrow/action overlays.
const _OVERLAY_ROW: int = 14
## Column index for the "selected" highlight sprite.
const _SELECTED_COL: int = 1

var _sprite: Sprite2D = null

func _init() -> void:
	# Build the visual eagerly so callers can invoke setup() before _ready
	# fires. Godot 4's add_child() runs _enter_tree synchronously but defers
	# _ready until the next idle, so anything that depends on _sprite must
	# tolerate being called pre-_ready.
	_sprite = Sprite2D.new()
	_sprite.name = "Visual"
	_sprite.centered = false
	# Keep nearest-neighbor filtering so the overlay stays crisp under zoom,
	# regardless of the project's default canvas filter.
	_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	add_child(_sprite)
	visible = false

## Bind the sprite atlas. Called by the owner (WorldRenderer) after construction.
func setup(resources: RenderResources) -> void:
	_sprite.texture = resources.sheet.region(_SELECTED_COL, _OVERLAY_ROW)

## Show the highlight at the given column. `z` should be the topmost terrain z.
## Position is the row sort key (no elevation); the visual child carries the
## screen-space z offset so Y-sort treats us like an entity in row `y`.
##
## z_index is `top_z + 1` so the overlay paints above *all* terrain stacked in
## this column (terrain entities use z_index = z). It ties with any entity
## standing on the column (player, tree, etc.) at z = top_z + 1; tree order
## then breaks the tie in favor of the entity, since entities are added to
## WorldRenderer later than this highlight \u2014 matching the legacy
## "after terrain, before entities" pass order.
func show_at(x: int, y: int, z: int) -> void:
	position = Utils.sort_position(x, y)
	z_index = Utils.z_index_for(z) + 1
	_sprite.position = Utils.visual_offset_for_z(z)
	visible = true

## Hide the highlight. Idempotent.
func hide_highlight() -> void:
	visible = false
