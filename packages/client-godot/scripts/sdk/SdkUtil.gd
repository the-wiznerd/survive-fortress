class_name SdkUtil
extends Object

## Helpers for safely narrowing Variants from JSON.parse_string output.
## GDScript's strict typing rejects passing Variant directly to typed
## constructors and function arguments, so every JSON field must be narrowed
## through one of these helpers.

static func to_int(v: Variant, default: int = 0) -> int:
	if v is int:
		var i: int = v
		return i
	if v is float:
		var f: float = v
		return int(f)
	if v is bool:
		var b: bool = v
		return 1 if b else 0
	return default

static func to_float(v: Variant, default: float = 0.0) -> float:
	if v is float:
		var f: float = v
		return f
	if v is int:
		var i: int = v
		return float(i)
	return default

static func to_bool(v: Variant, default: bool = false) -> bool:
	if v is bool:
		var b: bool = v
		return b
	return default

static func to_string_or(v: Variant, default: String = "") -> String:
	if v is String:
		var s: String = v
		return s
	return default

static func to_dict(v: Variant) -> Dictionary:
	if v is Dictionary:
		var d: Dictionary = v
		return d
	return {}

static func to_array(v: Variant) -> Array:
	if v is Array:
		var a: Array = v
		return a
	return []
