import type { ViewEntity } from '@sf/server/sdk'
import { type DrawContext, posKey } from '../types.js'
import { EntityRenderer } from './EntityRenderer.js'

const EDGE_ROWS = [2, 3, 4, 5] // 4 animation frames, same col layout per row
const EDGE_TOP_COLS = [0, 1, 2, 3, 5, 4, 6, 3]
const EDGE_FRONT_COLS = [9, 8, 10, 7]

/** Water sits 0.25 cells lower than surrounding terrain. */
const Y_OFFSET = 0.25
const ANIM_INTERVAL = 250 // ms per frame

export class WaterRenderer extends EntityRenderer {
  readonly terrain = true
  readonly occluding = false

  render(entity: ViewEntity, dc: DrawContext) {
    const { wx, wy, z, rc } = dc

    // Water borders appear where a same-z neighbor is non-water.
    const n = this.hasNonWaterNeighbor(rc.typeAt, wx, wy - 1, z) ? 1 : 0
    const e = this.hasNonWaterNeighbor(rc.typeAt, wx + 1, wy, z) ? 1 : 0
    const w = this.hasNonWaterNeighbor(rc.typeAt, wx - 1, wy, z) ? 1 : 0

    // Animation: stagger by world position so tiles don't all sync.
    const frame = (Math.floor(rc.now / ANIM_INTERVAL) + wx + wy) % EDGE_ROWS.length
    const row = EDGE_ROWS[frame]

    const topCol = EDGE_TOP_COLS[n * 4 + e * 2 + w]
    dc.draw(topCol, row, 1, 1, Y_OFFSET)

    if (!dc.frontOccluded) {
      const frontCol = EDGE_FRONT_COLS[e * 2 + w]
      dc.draw(frontCol, row, 1, 1, 1 + Y_OFFSET)
    }
  }

  /** Check if a cell has terrain at the given z that isn't water. */
  private hasNonWaterNeighbor(typeAt: Map<number, string>, x: number, y: number, z: number): boolean {
    const t = typeAt.get(posKey(x, y, z))
    return t !== undefined && t !== 'water'
  }

  describeTraits(entity: ViewEntity): string[] {
    return ['moisture']
  }
}
