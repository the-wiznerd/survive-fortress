import type { RenderEntity } from '~rendering/RenderContext.js'
import type { DrawContext } from '~rendering/DrawContext.js'
import { EntityRenderer } from '~rendering/entities/EntityRenderer.js'

const SPRITE_COL = 1
const SPRITE_ROW = 12
const SPRITE_HEIGHT = 2

export class BushRenderer extends EntityRenderer {
  render(entity: RenderEntity, dc: DrawContext) {
    dc.draw(SPRITE_COL, SPRITE_ROW, 1, SPRITE_HEIGHT)
  }
}
