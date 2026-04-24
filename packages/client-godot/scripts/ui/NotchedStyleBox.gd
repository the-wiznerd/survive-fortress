class_name NotchedStyleBox
extends StyleBox

## A StyleBox that fills its rect with `bg_color` minus a square chunk in each
## corner (a "+"-shaped fill). No anti-aliasing, no curves \u2014 the notches are
## crisp axis-aligned rects, sized in pixels.
##
## Used by chunky pixelated UI panels that want softened corners without
## introducing rounded geometry. A notch_size of 2 \u00d7 UI_PIXEL gives the
## same visual weight as a 2x2 UI-pixel cut.

@export var bg_color: Color = Color.WHITE
@export var notch_size: int = 2

func _draw(to_canvas_item: RID, rect: Rect2) -> void:
	if notch_size <= 0:
		RenderingServer.canvas_item_add_rect(to_canvas_item, rect, bg_color)
		return
	var n: float = float(notch_size)
	# Horizontal middle band: full width, height = rect.size.y - 2*notch.
	var mid: Rect2 = Rect2(
		rect.position + Vector2(0, n),
		Vector2(rect.size.x, rect.size.y - 2.0 * n),
	)
	RenderingServer.canvas_item_add_rect(to_canvas_item, mid, bg_color)
	# Top band: inset by notch on left/right.
	var top: Rect2 = Rect2(
		rect.position + Vector2(n, 0),
		Vector2(rect.size.x - 2.0 * n, n),
	)
	RenderingServer.canvas_item_add_rect(to_canvas_item, top, bg_color)
	# Bottom band: same, anchored to the bottom edge.
	var bot: Rect2 = Rect2(
		rect.position + Vector2(n, rect.size.y - n),
		Vector2(rect.size.x - 2.0 * n, n),
	)
	RenderingServer.canvas_item_add_rect(to_canvas_item, bot, bg_color)
