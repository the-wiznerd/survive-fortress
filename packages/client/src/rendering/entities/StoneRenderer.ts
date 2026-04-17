import type { ViewEntity, VisibleTraitName } from '@repo/server/sdk'

const STONE = terrainVariants(1, 11)

export class StoneRenderer extends EntityRenderer {
  readonly terrain = true

  render(entity: ViewEntity, dc: DrawContext) {
    dc.drawTerrain(STONE)
  }

  describeTraits(entity: ViewEntity): VisibleTraitName[] {
    return ['position']
  }
}
