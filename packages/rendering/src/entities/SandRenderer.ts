import type { RenderEntity, DrawContext } from '../types.js'
import { terrainVariants } from '../types.js'
import { EntityRenderer } from './EntityRenderer.js'

const SAND = terrainVariants(0, 7)

export class SandRenderer extends EntityRenderer {
  readonly terrain = true

  render(entity: RenderEntity, dc: DrawContext) {
    dc.drawTerrain(SAND)
  }
}
