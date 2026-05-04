class_name NotchedBorderStyleBox
extends StyleBox

## A StyleBox that draws four straight edges around its rect with the corners
## left open — top/bottom strips don't reach the side edges, and left/right
## strips don't reach the top/bottom. The result is a chunky pixel-art
## "tag with cropped corners" silhouette, no anti-aliasing.
##
## Sibling to NotchedStyleBox: that one does a notched fill, this one does
## a notched border. Used by feed entries that want an outline-only chip.

@export var border_color: Color = Color.WHITE
@export var border_width: int = 2
@export var notch_size: int = 2

func _draw(to_canvas_item: RID, rect: Rect2) -> void:
	if border_width <= 0:
		return
	var n: float = float(notch_size)
	var w: float = float(border_width)
	# Top edge: inset by `notch` on left/right.
	var top: Rect2 = Rect2(
		rect.position + Vector2(n, 0),
		Vector2(rect.size.x - 2.0 * n, w),
	)
	RenderingServer.canvas_item_add_rect(to_canvas_item, top, border_color)
	# Bottom edge: same shape, anchored to bottom.
	var bot: Rect2 = Rect2(
		rect.position + Vector2(n, rect.size.y - w),
		Vector2(rect.size.x - 2.0 * n, w),
	)
	RenderingServer.canvas_item_add_rect(to_canvas_item, bot, border_color)
	# Left edge: inset by `notch` on top/bottom.
	var left: Rect2 = Rect2(
		rect.position + Vector2(0, n),
		Vector2(w, rect.size.y - 2.0 * n),
	)
	RenderingServer.canvas_item_add_rect(to_canvas_item, left, border_color)
	# Right edge: same shape, anchored to right.
	var right: Rect2 = Rect2(
		rect.position + Vector2(rect.size.x - w, n),
		Vector2(w, rect.size.y - 2.0 * n),
	)
	RenderingServer.canvas_item_add_rect(to_canvas_item, right, border_color)
