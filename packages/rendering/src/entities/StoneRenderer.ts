import type { RenderEntity, DrawContext } from '../types.js'
import type { TerrainDef, TerrainVariantCells } from '../TerrainAtlas.js'
import { EntityRenderer } from './EntityRenderer.js'
import { Colors } from '../colors.js'

let STONE: TerrainVariantCells | undefined

export class StoneRenderer extends EntityRenderer {
  static readonly terrainDefs: Record<string, TerrainDef> = {
    stone: placeholder(Colors.gray, Colors.darkGray),
  }

  readonly terrain = true

  bindAtlas(stone: TerrainVariantCells) {
    STONE = stone
  }

  render(entity: RenderEntity, dc: DrawContext) {
    if (!STONE) return
    dc.drawTerrain(STONE, true)
  }
}
