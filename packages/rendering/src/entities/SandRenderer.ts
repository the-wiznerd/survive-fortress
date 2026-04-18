import type { RenderEntity, DrawContext } from '../types.js'
import type { TerrainVariantCells } from '../TerrainAtlas.js'
import { EntityRenderer } from './EntityRenderer.js'

let SAND: TerrainVariantCells | undefined

export class SandRenderer extends EntityRenderer {
  readonly terrain = true

  bindAtlas(sand: TerrainVariantCells) {
    SAND = sand
  }

  render(entity: RenderEntity, dc: DrawContext) {
    if (!SAND) return
    dc.drawTerrain(SAND, true)
  }
}
