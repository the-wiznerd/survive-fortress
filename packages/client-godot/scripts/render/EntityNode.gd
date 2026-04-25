class_name EntityNode
extends Node2D

## Visual representation of a single entity. Owned by WorldRenderer and looked
## up by entity_id across frames so we can update in place rather than rebuild.
##
## Subclasses override push_state() to react to a new ViewEntity from the server.
## The base implementation snaps position immediately; subclasses that need
## interpolation should store the new state as a target and lerp in _process().

var entity_id: int = -1
## Last received state. Subclasses can compare to detect changes.
var current_state: ViewEntity = null
## Visual root for sprite/rect children. Its position carries the screen-space
## elevation offset (-z * FRONT_FACE_H) so subclasses can position their visuals
## relative to a fixed local origin (top-left of the tile's top face) without
## doing z math themselves.
var visual: Node2D = null

func _ready() -> void:
	visual = Node2D.new()
	visual.name = "Visual"
	add_child(visual)

## Server pushed a new state for this entity. Default behavior:
##  - position = sort_position(x, y) so Godot's Y-sort orders us by world row
##  - z_index = z so taller entities in the same row paint over shorter ones
##  - visual.position = the z-offset so we appear at the right screen pixel
## Subclasses can override to interpolate, animate, or queue transitions.
##
## `world` carries per-frame neighbor info used by terrain nodes for edge
## selection and occlusion. Non-terrain nodes can ignore it. Pass null only
## when calling outside the normal render_view() path (none today).
func push_state(entity: ViewEntity, _world: WorldIndex = null) -> void:
	current_state = entity
	position = Utils.sort_position(entity.x, entity.y)
	z_index = Utils.z_index_for(entity.z)
	visual.position = Utils.visual_offset_for_z(entity.z)

## Subclasses can override to set up sprite resources etc. Called by
## WorldRenderer immediately after instantiation, before the first push_state.
## Subclasses should add their visuals as children of `visual`, not `self`.
func setup(_resources: RenderResources) -> void:
	pass
