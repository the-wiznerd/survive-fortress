import type { RenderEntity, DrawContext } from '../types.js'
import type { TerrainDef, TerrainVariantCells } from '../TerrainAtlas.js'
import { EntityRenderer } from './EntityRenderer.js'

let DIRT: TerrainVariantCells | undefined
let GRASS: TerrainVariantCells | undefined

export class DirtRenderer extends EntityRenderer {
  static readonly terrainDefs: Record<string, TerrainDef> = {
    dirt: placeholder('#a7814e', '#7f5845'),
    grass: placeholder('#a2af50', '#627c4e'),
  }

  readonly terrain = true

  /** Called by WorldRenderer after atlas generation. */
  bindAtlas(dirt: TerrainVariantCells, grass: TerrainVariantCells) {
    DIRT = dirt
    GRASS = grass
  }

  render(entity: RenderEntity, dc: DrawContext) {
    if (!DIRT) return
    dc.drawTerrain(DIRT, true)
    const cover = (entity.traits.groundCover as { cover?: string } | undefined)?.cover
    if (cover === 'grass' && GRASS) {
      dc.drawTerrain(GRASS, true)
    }
  }
}
