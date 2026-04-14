import type { ViewEntity } from '@sf/server/sdk'
import type { DrawContext, EdgeVariants } from '../types.js'
import { EntityRenderer } from './EntityRenderer.js'

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

  describeTraits(entity: ViewEntity): string[] {
    return ['moisture']
  }
}
