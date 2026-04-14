/**
 * Base class for per-entity-type renderers.
 * Subclasses override render() and optionally inspect().
 */
export abstract class EntityRenderer {
  /** Whether this entity is terrain (front face occluded by next row). */
  readonly terrain: boolean = false

  /** Whether this terrain occludes the front face of the row above it. */
  readonly occluding: boolean = true

  /** Render this entity using the given draw context. */
  abstract render(id: EntityId, dc: DrawContext): void

  /** Return HTML for the inspector panel, or null for default trait dump. */
  inspect(id: EntityId, world: World): string | null {
    return null
  }
}
