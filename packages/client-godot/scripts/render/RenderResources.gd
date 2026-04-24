class_name RenderResources
extends RefCounted

## Bag of shared rendering resources passed to each EntityNode at setup time.
## Keeps the EntityNode.setup() signature stable as new resource kinds are
## added (UI atlas, particle textures, etc.).

var sheet: SpriteSheet = null
var terrain_atlas: TerrainAtlas = null
