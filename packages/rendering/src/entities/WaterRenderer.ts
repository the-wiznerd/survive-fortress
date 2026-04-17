import type { RenderEntity, DrawContext } from '../types.js'
import { terrainVariants, posKey, CELL_H, CELL_W } from '../types.js'
import { EntityRenderer } from './EntityRenderer.js'

const ANIM_ROWS = [2, 3, 4, 5]
const WATER = terrainVariants(0, 0)
const Y_OFFSET = 0.25
const ANIM_INTERVAL = 250

export class WaterRenderer extends EntityRenderer {
  readonly terrain = true
  readonly occluding = false

  render(entity: RenderEntity, dc: DrawContext) {
    const { wx, wy, z, rc } = dc

    const n = this.hasNonWaterNeighbor(rc.typeAt, wx, wy - 1, z) ? 1 : 0
    const e = this.hasNonWaterNeighbor(rc.typeAt, wx + 1, wy, z) ? 1 : 0
    const w = this.hasNonWaterNeighbor(rc.typeAt, wx - 1, wy, z) ? 1 : 0

    const frame = (Math.floor(rc.now / ANIM_INTERVAL) + wx + wy) % ANIM_ROWS.length
    const row = ANIM_ROWS[frame]

    const topCol = WATER.topCols[n * 4 + e * 2 + w]
    dc.draw(topCol, row, 1, 1, Y_OFFSET)

    if (!dc.frontOccluded) {
      const frontCol = WATER.frontCols[e * 2 + w]
      dc.draw(frontCol, row, 1, 1, 1 + Y_OFFSET)
    }
  }

  private hasNonWaterNeighbor(typeAt: Map<number, string>, x: number, y: number, z: number): boolean {
    const t = typeAt.get(posKey(x, y, z))
    return t !== undefined && t !== 'water'
  }
}
