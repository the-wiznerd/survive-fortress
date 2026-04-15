import type { ViewEntity, VisibleTraitName } from '@repo/server/sdk'

const EDGE: EdgeVariants = {
  row: 0,
  topCols: [11, 12, 13, 14, 16, 15, 17, 14],
  frontCols: [20, 19, 21, 18],
}

export class SandRenderer extends EntityRenderer {
  readonly terrain = true

  render(entity: ViewEntity, dc: DrawContext) {
    dc.drawEdgeTerrain(EDGE)
  }

  describeTraits(entity: ViewEntity): VisibleTraitName[] {
    return ['moisture']
  }
}
