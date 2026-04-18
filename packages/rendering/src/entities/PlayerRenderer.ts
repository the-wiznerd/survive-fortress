import type { RenderEntity, DrawContext } from '~rendering/types.js'
import { EntityRenderer } from '~rendering/entities/EntityRenderer.js'

const SPRITE_COL = 0
const SPRITE_ROW = 14
const SPRITE_HEIGHT = 2
const Y_OFFSET = -0.25

export class PlayerRenderer extends EntityRenderer {
  render(entity: RenderEntity, dc: DrawContext) {
    dc.draw(SPRITE_COL, SPRITE_ROW, 1, SPRITE_HEIGHT, Y_OFFSET)
  }
}
