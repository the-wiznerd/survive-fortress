import type { RenderEntity } from '~rendering/RenderContext.js'
import type { DrawContext } from '~rendering/DrawContext.js'
import { EntityRenderer } from '~rendering/entities/EntityRenderer.js'

const SPRITE_COL = 0
const SPRITE_ROW = 11
const SPRITE_HEIGHT = 3

export class PlayerRenderer extends EntityRenderer {
  render(entity: RenderEntity, dc: DrawContext) {
    dc.draw(SPRITE_COL, SPRITE_ROW, 1, SPRITE_HEIGHT)
  }
}
