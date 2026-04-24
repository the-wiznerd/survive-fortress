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

## Server pushed a new state for this entity. Default behavior: snap position
## and stash the state so subclasses can read previous values from
## current_state if they want to detect transitions.
func push_state(entity: ViewEntity) -> void:
	current_state = entity
	position = Constants.project(entity.x, entity.y, entity.z)

## Subclasses can override to set up sprite resources etc. Called by
## WorldRenderer immediately after instantiation, before the first push_state.
func setup(_sheet: SpriteSheet) -> void:
	pass
