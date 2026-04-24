class_name EntityNodeFactory
extends RefCounted

## Maps entity.type_name (server-side type string, lowercase) to the EntityNode
## subclass that should render it. Add new entity types by registering here.
##
## Type names come from packages/engine/src/entityTypes/*.ts (the `type` field
## on each BaseEntityType subclass).

const _REGISTRY: Dictionary = {
	"player": preload("res://scripts/render/entities/PlayerNode.gd"),
	"bush": preload("res://scripts/render/entities/BushNode.gd"),
	"berry": preload("res://scripts/render/entities/BerryNode.gd"),
	"bag": preload("res://scripts/render/entities/BagNode.gd"),
	"dirt": preload("res://scripts/render/entities/DirtNode.gd"),
	"sand": preload("res://scripts/render/entities/SandNode.gd"),
	"stone": preload("res://scripts/render/entities/StoneNode.gd"),
	"water": preload("res://scripts/render/entities/WaterNode.gd"),
}

## Build a fresh EntityNode for the given type. Returns null if the type is
## unrecognized; callers should log a warning and skip.
static func build(type_name: String) -> EntityNode:
	var script: GDScript = _REGISTRY.get(type_name, null)
	if script == null:
		return null
	var node: EntityNode = script.new()
	return node
