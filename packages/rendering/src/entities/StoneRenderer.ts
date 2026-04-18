import type { RenderEntity, DrawContext } from '../types.js'
import type { TerrainVariantCells } from '../TerrainAtlas.js'
import { EntityRenderer } from './EntityRenderer.js'

let STONE: TerrainVariantCells | undefined

export class StoneRenderer extends EntityRenderer {
  readonly terrain = true

  bindAtlas(stone: TerrainVariantCells) {
    STONE = stone
  }

  render(entity: RenderEntity, dc: DrawContext) {
    if (!STONE) return
    dc.drawTerrain(STONE, true)
  }
}
