import type { RenderEntity, DrawContext } from '~rendering/types.js'
import type { TerrainDef, TerrainVariantCells } from '~rendering/TerrainAtlas.js'
import { EntityRenderer } from '~rendering/entities/EntityRenderer.js'
import { Colors } from '~rendering/colors.js'

let SAND: TerrainVariantCells | undefined

export class SandRenderer extends EntityRenderer {
  static readonly terrainDefs: Record<string, TerrainDef> = {
    sand: {
      top(ctx, w, h) {
        ctx.fillStyle = Colors.lightestGreen
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = Colors.lightGreen
        ctx.fillRect(5, 3, 1, 1)
        ctx.fillRect(14, 1, 1, 1)
        ctx.fillRect(10, 8, 1, 1)
      },
      front(ctx, w, h) {
        ctx.fillStyle = Colors.lightGreen
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = Colors.lightYellow
        ctx.fillRect(4, 8, 1, 1)
        ctx.fillRect(11, 4, 1, 1)
      },
      unknownTop(ctx, w, h) {
        ctx.fillStyle = Colors.lightYellow
        ctx.fillRect(0, 0, w, h)
      },
      topEdgeColor: Colors.lightGreen,
      frontEdgeColor: Colors.lightYellow,
    },
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
