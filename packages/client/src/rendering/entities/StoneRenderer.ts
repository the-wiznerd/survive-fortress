import type { ViewEntity } from '@repo/server/sdk'

const STONE = terrainVariants(1, 11)

export class StoneRenderer extends EntityRenderer {
  readonly terrain = true

  render(entity: ViewEntity, dc: DrawContext) {
    dc.drawTerrain(STONE)
  }
}
