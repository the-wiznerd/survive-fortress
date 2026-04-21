import type { RenderEntity } from '~rendering/RenderContext.js'
import type { DrawContext } from '~rendering/DrawContext.js'
import { EntityRenderer } from '~rendering/entities/EntityRenderer.js'

const LARGE_SPRITE_COL = 1
const LARGE_BERRY_SPRITE_COL = 2
const SMALL_SPRITE_COL = 3
const SMALL_BERRY_SPRITE_COL = 4
const SPRITE_ROW = 13
const SPRITE_HEIGHT = 2

export class BushRenderer extends EntityRenderer {
  render(entity: RenderEntity, dc: DrawContext) {
    const small = entity.traits.size === 'small'
    const hasBerries = (entity.traits.harvestable as { available: boolean } | undefined)?.available === true
    const col = small
      ? (hasBerries ? SMALL_BERRY_SPRITE_COL : SMALL_SPRITE_COL)
      : (hasBerries ? LARGE_BERRY_SPRITE_COL : LARGE_SPRITE_COL)
    dc.draw(col, SPRITE_ROW, 1, SPRITE_HEIGHT)
  }
}
