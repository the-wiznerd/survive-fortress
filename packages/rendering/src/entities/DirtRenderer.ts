import type { RenderEntity, DrawContext } from '../types.js'
import { terrainVariants } from '../types.js'
import { EntityRenderer } from './EntityRenderer.js'

const DIRT = terrainVariants(0, 0)
const GRASS = terrainVariants(0, 12)

export class DirtRenderer extends EntityRenderer {
  readonly terrain = true

  render(entity: RenderEntity, dc: DrawContext) {
    dc.drawTerrain(DIRT)
    const cover = (entity.traits.groundCover as { cover?: string } | undefined)?.cover
    if (cover === 'grass') {
      dc.drawTerrain(GRASS)
    }
  }
}
