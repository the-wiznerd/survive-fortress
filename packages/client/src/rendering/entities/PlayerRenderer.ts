import type { ViewEntity } from '@repo/server/sdk'
import type { DrawContext } from '../types.js'
import { EntityRenderer } from './EntityRenderer.js'

const SPRITE_COL = 0
const SPRITE_ROW = 6
const SPRITE_HEIGHT = 2
const Y_OFFSET = -0.25

export class PlayerRenderer extends EntityRenderer {
  render(entity: ViewEntity, dc: DrawContext) {
    dc.draw(SPRITE_COL, SPRITE_ROW, 1, SPRITE_HEIGHT, Y_OFFSET)
  }

  describeTraits(entity: ViewEntity): string[] {
    return ['health', 'hunger', 'speed']
  }
}
