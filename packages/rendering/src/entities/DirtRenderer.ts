import type { RenderEntity, DrawContext } from '../types.js'
import type { TerrainDef, TerrainVariantCells } from '../TerrainAtlas.js'
import { EntityRenderer } from './EntityRenderer.js'

import { Colors } from '../colors.js'

let DIRT: TerrainVariantCells | undefined
let GRASS: TerrainVariantCells | undefined

export class DirtRenderer extends EntityRenderer {
  static readonly terrainDefs: Record<string, TerrainDef> = {
    dirt: {
      top(ctx, w, h) {
        ctx.fillStyle = Colors.lightYellow
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = Colors.yellow
        ctx.fillRect(5, 3, 1, 1)
        ctx.fillRect(14, 1, 1, 1)
        ctx.fillRect(10, 8, 1, 1)
      },
      front(ctx, w, h) {
        ctx.fillStyle = Colors.yellow
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = Colors.darkYellow
        ctx.fillRect(4, 8, 1, 1)
        ctx.fillRect(11, 4, 1, 1)
      },
      unknownTop(ctx, w, h) {
        ctx.fillStyle = Colors.darkYellow
        ctx.fillRect(0, 0, w, h)
      },
      topEdgeColor: Colors.yellow,
      frontEdgeColor: Colors.darkYellow,
    },
    grass: {
      top(ctx, w, h) {
        ctx.fillStyle = Colors.green
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = Colors.lightGreen
        ctx.fillRect(5, 3, 1, 1)
        ctx.fillRect(14, 1, 1, 1)
        ctx.fillRect(10, 8, 1, 1)
      },
      front(ctx, w, h) {
        // Dirt base
        ctx.fillStyle = Colors.yellow
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = Colors.darkYellow
        ctx.fillRect(4, 8, 1, 1)
        ctx.fillRect(11, 4, 1, 1)
        // Grass strip: row 1 = darkYellow, row 0 = darkGreen with green pixels
        ctx.fillRect(0, 1, w, 1)
        ctx.fillStyle = Colors.darkGreen
        ctx.fillRect(0, 0, w, 1)
        ctx.fillStyle = Colors.green
        ctx.fillRect(2, 0, 1, 1)
        ctx.fillRect(7, 0, 1, 1)
        ctx.fillRect(10, 0, 1, 1)
        ctx.fillRect(w - 1, 0, 1, 1)
      },
      unknownTop(ctx, w, h) {
        ctx.fillStyle = Colors.darkGreen
        ctx.fillRect(0, 0, w, h)
      },
      topEdgeColor: Colors.darkGreen,
      frontEdgeColor: Colors.darkYellow,
    },
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
