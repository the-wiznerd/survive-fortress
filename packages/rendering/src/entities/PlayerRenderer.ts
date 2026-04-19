import type { RenderEntity, DrawContext } from '~rendering/types.js'
import { EntityRenderer } from '~rendering/entities/EntityRenderer.js'

const SPRITE_COL = 0
const SPRITE_ROW = 12
const SPRITE_HEIGHT = 3

export class PlayerRenderer extends EntityRenderer {
  render(entity: RenderEntity, dc: DrawContext) {
    dc.draw(SPRITE_COL, SPRITE_ROW, 1, SPRITE_HEIGHT)
  }
}
