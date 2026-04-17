import type { ViewEntity, VisibleTraitName } from '@repo/server/sdk'

const SAND = terrainVariants(0, 11)

export class SandRenderer extends EntityRenderer {
  readonly terrain = true

  render(entity: ViewEntity, dc: DrawContext) {
    dc.drawTerrain(SAND)
  }

  describeTraits(entity: ViewEntity): VisibleTraitName[] {
    return ['moisture']
  }
}
