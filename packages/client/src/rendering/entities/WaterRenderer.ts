import type { ViewEntity, VisibleTraitName } from '@repo/server/sdk'

const ANIM_ROWS = [2, 3, 4, 5] // 4 animation frames, same col layout per row
const WATER = terrainVariants(0, 0)  // cols are row-independent; row picked per-frame

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
    const frame = (Math.floor(rc.now / ANIM_INTERVAL) + wx + wy) % ANIM_ROWS.length
    const row = ANIM_ROWS[frame]

    const topCol = WATER.topCols[n * 4 + e * 2 + w]
    dc.draw(topCol, row, 1, 1, Y_OFFSET)

    if (!dc.frontOccluded) {
      const frontCol = WATER.frontCols[e * 2 + w]
      dc.draw(frontCol, row, 1, 1, 1 + Y_OFFSET)
    }
  }

  /** Check if a cell has terrain at the given z that isn't water. */
  private hasNonWaterNeighbor(typeAt: Map<number, string>, x: number, y: number, z: number): boolean {
    const t = typeAt.get(posKey(x, y, z))
    return t !== undefined && t !== 'water'
  }

  describeTraits(entity: ViewEntity): VisibleTraitName[] {
    return ['moisture']
  }
}
