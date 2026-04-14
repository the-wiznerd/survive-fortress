/**
 * Base class for per-entity-type renderers.
 * Subclasses override render() and optionally describe().
 */
export abstract class EntityRenderer {
  /** Whether this entity is terrain (front face occluded by next row). */
  readonly terrain: boolean = false

  /** Whether this terrain occludes the front face of the row above it. */
  readonly occluding: boolean = true

  /** Render this entity using the given draw context. */
  abstract render(id: EntityId, dc: DrawContext): void

  /** Return trait names to display on the entity card, in order. */
  describe(id: EntityId, world: World): string[] {
    return []
  }
}
