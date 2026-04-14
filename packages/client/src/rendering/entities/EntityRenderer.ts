import type { ViewEntity } from '@repo/server/sdk'

/**
 * Base class for per-entity-type renderers.
 * Subclasses override render() and optionally describeTraits().
 */
export abstract class EntityRenderer {
  /** Whether this entity is terrain (front face occluded by next row). */
  readonly terrain: boolean = false

  /** Whether this terrain occludes the front face of the row above it. */
  readonly occluding: boolean = true

  /** Render this entity using the given draw context. */
  abstract render(entity: ViewEntity, dc: DrawContext): void

  /** Return trait names to display on the entity card, in order. */
  describeTraits(entity: ViewEntity): string[] {
    return []
  }
}
