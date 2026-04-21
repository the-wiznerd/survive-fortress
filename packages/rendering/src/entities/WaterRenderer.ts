import type { RenderEntity } from '~rendering/RenderContext.js'
import type { DrawContext } from '~rendering/DrawContext.js'
import { terrainVariants } from '~rendering/sprites.js'
import { posKey } from '~rendering/spatial.js'
import { EntityRenderer } from '~rendering/entities/EntityRenderer.js'

const WATER_FRAMES = [
  terrainVariants(2, 0),
  terrainVariants(4, 0),
  terrainVariants(6, 0),
  terrainVariants(8, 0),
]
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

    const frame = ((Math.floor(rc.now / ANIM_INTERVAL) + wx + wy) % WATER_FRAMES.length + WATER_FRAMES.length) % WATER_FRAMES.length
    const water = WATER_FRAMES[frame]!

    const top = water.topFaces[n * 4 + e * 2 + w]!
    dc.drawSheetTop(top.col, top.row, Y_OFFSET)

    if (!dc.frontOccluded) {
      const front = water.frontFaces[e * 2 + w]!
      dc.drawSheetFront(front.col, front.row, 1 + Y_OFFSET)
    }
  }

  private hasNonWaterNeighbor(typeAt: Map<number, string>, x: number, y: number, z: number): boolean {
    const t = typeAt.get(posKey(x, y, z))
    return t !== undefined && t !== 'water'
  }
}
