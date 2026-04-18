import type { RenderEntity, DrawContext } from '../types.js'
import { terrainVariants } from '../types.js'
import { EntityRenderer } from './EntityRenderer.js'

const STONE = terrainVariants(0, 21)

export class StoneRenderer extends EntityRenderer {
  readonly terrain = true

  render(entity: RenderEntity, dc: DrawContext) {
    dc.drawTerrain(STONE)
  }
}
