class_name WorldIndex
extends RefCounted

## Per-frame spatial index of the entities in a GameView, used by terrain
## EntityNodes to look up neighbor info for edge selection and front-face
## occlusion. Built once per render_view() call by WorldRenderer.
##
## Mirrors the maxZ / minZ / terrainAt fields of the canvas RenderContext.

## Type names that participate in terrain neighbor logic. Lowercase to match
## server-side entity type names (see entityTypes/*.ts).
const TERRAIN_TYPES: Dictionary = {
	"dirt": true,
	"sand": true,
	"stone": true,
	"water": true,
}

## Terrain types that count as "solid" for front-face support/occlusion. Water
## is excluded so e.g. a stone tile sitting next to water still shows its
## front face (water shouldn't hide it). Top-face border variants still treat
## water as a neighbor (no border against water — borders are for true
## elevation changes), so only the front-face checks have a solid variant.
const SOLID_TERRAIN_TYPES: Dictionary = {
	"dirt": true,
	"sand": true,
	"stone": true,
}

# "x,y" -> int (highest z of any terrain in that column)
var _max_z: Dictionary = {}
# "x,y" -> int (lowest z of any terrain in that column)
var _min_z: Dictionary = {}
# "x,y" -> int (lowest z of any SOLID terrain in that column, water excluded)
var _min_z_solid: Dictionary = {}
# "x,y,z" -> bool (terrain present at this exact position)
var _terrain_at: Dictionary = {}
# "x,y,z" -> bool (solid terrain present at this exact position)
var _solid_at: Dictionary = {}
# "x,y,z" -> String (terrain type at this exact position)
var _type_at: Dictionary = {}

static func build(view: GameView) -> WorldIndex:
	var idx: WorldIndex = WorldIndex.new()
	for entity: ViewEntity in view.entities:
		if entity.has_trait("contained"):
			continue
		if not TERRAIN_TYPES.has(entity.type_name):
			continue
		var ck: String = "%d,%d" % [entity.x, entity.y]
		var pk: String = "%d,%d,%d" % [entity.x, entity.y, entity.z]
		idx._terrain_at[pk] = true
		idx._type_at[pk] = entity.type_name
		var prev_max: Variant = idx._max_z.get(ck)
		if prev_max == null or entity.z > (prev_max as int):
			idx._max_z[ck] = entity.z
		var prev_min: Variant = idx._min_z.get(ck)
		if prev_min == null or entity.z < (prev_min as int):
			idx._min_z[ck] = entity.z
		if SOLID_TERRAIN_TYPES.has(entity.type_name):
			idx._solid_at[pk] = true
			var prev_min_s: Variant = idx._min_z_solid.get(ck)
			if prev_min_s == null or entity.z < (prev_min_s as int):
				idx._min_z_solid[ck] = entity.z
	return idx

# --- Top face edges ---
# A top-face edge is drawn on the side where this tile sticks up above its
# neighbor (neighbor.max_z < self.z). Returns 0 if the neighboring column is
# unknown (no entry in _max_z) — matches the canvas behavior of suppressing
# edges into unknown space.

func top_edge_north(x: int, y: int, z: int) -> int:
	return _edge_taller_than_neighbor(x, y - 1, z)

func top_edge_east(x: int, y: int, z: int) -> int:
	return _edge_taller_than_neighbor(x + 1, y, z)

func top_edge_west(x: int, y: int, z: int) -> int:
	return _edge_taller_than_neighbor(x - 1, y, z)

func _edge_taller_than_neighbor(nx: int, ny: int, z: int) -> int:
	var v: Variant = _max_z.get("%d,%d" % [nx, ny])
	if v == null:
		return 0
	return 1 if (v as int) < z else 0

# --- Front face edges ---
# Bottom (south) edge of the front face: drawn when there's terrain below me
# in the same column but nothing directly at z-1 (i.e. I'm a "floating" tile
# and the bottom of my front face is exposed).

func front_edge_south(x: int, y: int, z: int) -> int:
	var min_v: Variant = _min_z.get("%d,%d" % [x, y])
	if min_v == null:
		return 0
	if (min_v as int) >= z:
		return 0
	return 0 if _terrain_at.has("%d,%d,%d" % [x, y, z - 1]) else 1

func front_edge_east(x: int, y: int, z: int) -> int:
	# East/west edges of the front face share the same logic as the top:
	# drawn where the neighbor column doesn't reach this z.
	return _edge_taller_than_neighbor(x + 1, y, z)

func front_edge_west(x: int, y: int, z: int) -> int:
	return _edge_taller_than_neighbor(x - 1, y, z)

# --- Front face occlusion ---
# The front face is dropped entirely if the southern neighbor at the same z
# has terrain (its top face covers the same screen pixels we'd draw).

func front_occluded(x: int, y: int, z: int) -> bool:
	return _terrain_at.has("%d,%d,%d" % [x, y + 1, z])

## Terrain type at the exact position, or "" if no terrain is there.
func type_at(x: int, y: int, z: int) -> String:
	return SdkUtil.to_string_or(_type_at.get("%d,%d,%d" % [x, y, z], ""))

# --- Solid-only front-face checks (water doesn't count) ---
# Used so terrain next to or above water still shows its front face / bottom
# border. Top-face border variants intentionally still treat water as a
# neighbor — borders are reserved for true elevation changes.

func front_edge_south_solid(x: int, y: int, z: int) -> int:
	var min_v: Variant = _min_z_solid.get("%d,%d" % [x, y])
	if min_v == null:
		return 0 if _solid_at.has("%d,%d,%d" % [x, y, z - 1]) else 1
	if (min_v as int) >= z:
		return 0
	return 0 if _solid_at.has("%d,%d,%d" % [x, y, z - 1]) else 1

func front_occluded_solid(x: int, y: int, z: int) -> bool:
	return _solid_at.has("%d,%d,%d" % [x, y + 1, z])
