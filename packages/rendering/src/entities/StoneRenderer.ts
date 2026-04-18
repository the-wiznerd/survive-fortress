import type { RenderEntity, DrawContext } from '~rendering/types.js'
import type { TerrainDef, TerrainVariantCells } from '~rendering/TerrainAtlas.js'
import { EntityRenderer } from '~rendering/entities/EntityRenderer.js'
import { Colors } from '~rendering/colors.js'

let STONE: TerrainVariantCells | undefined

export class StoneRenderer extends EntityRenderer {
  static readonly terrainDefs: Record<string, TerrainDef> = {
    stone: {
      top(ctx, w, h) {
        ctx.fillStyle = Colors.lightestGray
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = Colors.lightGray
        ctx.fillRect(5, 11, 1, 1)
        ctx.fillRect(6, 10, 1, 1)
        ctx.fillRect(10, 2, 1, 1)
      },
      front(ctx, w, h) {
        ctx.fillStyle = Colors.lightGray
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = Colors.gray
        ctx.fillRect(2, 9, 1, 1)
        ctx.fillRect(3, 8, 1, 1)
        ctx.fillRect(5, 0, 1, 1)
        ctx.fillRect(11, 3, 1, 1)
        ctx.fillRect(11, 4, 1, 1)
        ctx.fillRect(12, 5, 1, 1)
        ctx.fillRect(12, 6, 1, 1)
      },
      unknownTop(ctx, w, h) {
        ctx.fillStyle = Colors.gray
        ctx.fillRect(0, 0, w, h)
      },
      topEdgeColor: Colors.lightGray,
      frontEdgeColor: Colors.gray,
    },
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
