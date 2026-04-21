import type { RenderEntity } from '~rendering/RenderContext.js'
import type { DrawContext } from '~rendering/DrawContext.js'
import { EntityRenderer } from '~rendering/entities/EntityRenderer.js'

const LARGE_SPRITE_COL = 1
const SMALL_SPRITE_COL = 2
const SPRITE_ROW = 13
const SPRITE_HEIGHT = 2

export class BushRenderer extends EntityRenderer {
  render(entity: RenderEntity, dc: DrawContext) {
    const size = entity.traits.size === 'small' ? 'small' : 'large'
    const col = size === 'small' ? SMALL_SPRITE_COL : LARGE_SPRITE_COL
    dc.draw(col, SPRITE_ROW, 1, SPRITE_HEIGHT)
  }
}
