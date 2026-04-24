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

# "x,y" -> int (highest z of any terrain in that column)
var _max_z: Dictionary = {}
# "x,y" -> int (lowest z of any terrain in that column)
var _min_z: Dictionary = {}
# "x,y,z" -> bool (terrain present at this exact position)
var _terrain_at: Dictionary = {}

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
		var prev_max: Variant = idx._max_z.get(ck)
		if prev_max == null or entity.z > (prev_max as int):
			idx._max_z[ck] = entity.z
		var prev_min: Variant = idx._min_z.get(ck)
		if prev_min == null or entity.z < (prev_min as int):
			idx._min_z[ck] = entity.z
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
