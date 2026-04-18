import type { RenderEntity, DrawContext } from '../types.js'
import type { TerrainDef, TerrainVariantCells } from '../TerrainAtlas.js'
import { EntityRenderer } from './EntityRenderer.js'

let SAND: TerrainVariantCells | undefined

export class SandRenderer extends EntityRenderer {
  static readonly terrainDefs: Record<string, TerrainDef> = {
    sand: placeholder('#c5a45f', '#a7814e'),
  }

  readonly terrain = true

  bindAtlas(sand: TerrainVariantCells) {
    SAND = sand
  }

  render(entity: RenderEntity, dc: DrawContext) {
    if (!SAND) return
    dc.drawTerrain(SAND, true)
  }
}
