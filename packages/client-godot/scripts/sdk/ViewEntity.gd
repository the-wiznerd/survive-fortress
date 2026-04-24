class_name ViewEntity
extends RefCounted

## Mirrors `ViewEntity` in packages/server/src/sdk/types.ts.
## Trait data is left as a raw Dictionary keyed by trait name; typed accessors
## can be added per-trait as features need them.

var id: int = 0
var type_name: String = ""
var x: int = 0
var y: int = 0
var z: int = 0
var entity_name: String = ""
## Visible trait data keyed by trait name. Values are raw Dictionaries from JSON.
var traits: Dictionary = {}

static func from_dict(d: Dictionary) -> ViewEntity:
	var e: ViewEntity = ViewEntity.new()
	e.id = SdkUtil.to_int(d.get("id", 0))
	e.type_name = SdkUtil.to_string_or(d.get("type", ""))
	e.x = SdkUtil.to_int(d.get("x", 0))
	e.y = SdkUtil.to_int(d.get("y", 0))
	e.z = SdkUtil.to_int(d.get("z", 0))
	e.entity_name = SdkUtil.to_string_or(d.get("name", ""))
	e.traits = SdkUtil.to_dict(d.get("traits", {}))
	return e

func has_trait(name: String) -> bool:
	return traits.has(name)

func get_trait(name: String) -> Dictionary:
	return SdkUtil.to_dict(traits.get(name, {}))
