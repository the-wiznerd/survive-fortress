/**
 * Base class for per-trait UI renderers.
 * Each subclass knows how to turn a specific trait's data into a web component.
 */
export abstract class TraitRenderer {
  abstract render(id: EntityId, world: World): HTMLElement
}
