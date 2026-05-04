class_name ShrinkableWrapper
extends Container

## A Container whose combined minimum size is just `custom_minimum_size` —
## its single child's natural minimum is ignored, so the wrapper can be
## animated below that minimum without the child vetoing the shrink.
##
## We use a plain Container (not PanelContainer) because the C++
## implementations of PanelContainer::get_minimum_size and
## Label::get_minimum_size shadow the GDScript `_get_minimum_size` virtual
## — overriding it on those subclasses has no runtime effect. Container
## inherits Control::get_minimum_size, which does call the virtual.
##
## clip_contents masks any inner overflow when the wrapper is shrunk; the
## child is laid out to fill the wrapper's rect via fit_child_in_rect on
## NOTIFICATION_SORT_CHILDREN.

func _ready() -> void:
	clip_contents = true

func _get_minimum_size() -> Vector2:
	return Vector2.ZERO

func _notification(what: int) -> void:
	if what == NOTIFICATION_SORT_CHILDREN:
		for c: Node in get_children():
			if c is Control:
				fit_child_in_rect(c as Control, Rect2(Vector2.ZERO, size))
