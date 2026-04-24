class_name WorldRenderer
extends Node2D

## Owns the rendered world. Maintains a stable mapping of entity_id → EntityNode
## so updates are reconciliation, not rebuild — required for any future
## interpolation, animation, or transition the EntityNode wants to express.
##
## Y-sort is enabled here. Each EntityNode's `position.y` is its projected
## screen y (which already encodes both world y and z), so Godot's child sort
## produces correct painter's-order occlusion for free.

var _resources: RenderResources = null
## entity_id (int) → EntityNode currently mounted as our child.
var _nodes: Dictionary = {}

func _ready() -> void:
	y_sort_enabled = true
	_resources = RenderResources.new()
	_resources.sheet = SpriteSheet.new()
	_resources.terrain_sheet = TerrainSheet.new()

## Reconcile our scene against the entities in `view`.
##  - existing nodes get a new push_state()
##  - missing nodes are spawned + pushed
##  - nodes whose ids are no longer in the view are queue_free()'d
func render_view(view: GameView) -> void:
	var world_index: WorldIndex = WorldIndex.build(view)
	var seen: Dictionary = {}
	for entity: ViewEntity in view.entities:
		# Skip entities that live inside a container (bag contents, equipped
		# items, etc). They appear in the view so the client can show inventory,
		# but they have no meaningful world position to render.
		if entity.has_trait("contained"):
			continue
		seen[entity.id] = true
		var node: EntityNode = _nodes.get(entity.id, null) as EntityNode
		if node == null:
			node = EntityNodeFactory.build(entity.type_name)
			if node == null:
				push_warning("[WorldRenderer] Unknown entity type '%s' (id=%d); skipping." % [entity.type_name, entity.id])
				continue
			node.entity_id = entity.id
			node.name = "%s_%d" % [entity.type_name, entity.id]
			add_child(node)
			node.setup(_resources)
			_nodes[entity.id] = node
		node.push_state(entity, world_index)

	# Drop any nodes that aren't in the new view.
	var to_remove: Array[int] = []
	for id_variant: Variant in _nodes.keys():
		if id_variant is int:
			var id: int = id_variant
			if not seen.has(id):
				to_remove.append(id)
	for id in to_remove:
		var node: EntityNode = _nodes[id] as EntityNode
		_nodes.erase(id)
		node.queue_free()
