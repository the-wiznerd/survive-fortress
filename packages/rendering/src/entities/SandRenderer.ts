import type { RenderEntity, DrawContext } from '../types.js'
import type { TerrainDef, TerrainVariantCells } from '../TerrainAtlas.js'
import { EntityRenderer } from './EntityRenderer.js'
import { Colors } from '../colors.js'

let SAND: TerrainVariantCells | undefined

export class SandRenderer extends EntityRenderer {
  static readonly terrainDefs: Record<string, TerrainDef> = {
    sand: placeholder(Colors.lightYellow, Colors.yellow),
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
