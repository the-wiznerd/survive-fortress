import type { RenderEntity } from '~rendering/RenderContext.js'
import type { DrawContext } from '~rendering/DrawContext.js'

/** Base class for entity renderers. */
export abstract class EntityRenderer {
  readonly terrain: boolean = false
  readonly occluding: boolean = true
  abstract render(entity: RenderEntity, dc: DrawContext): void
}
