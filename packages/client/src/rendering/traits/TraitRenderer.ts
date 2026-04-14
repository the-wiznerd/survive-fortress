/**
 * Base class for per-trait UI renderers.
 * Each subclass knows how to turn trait view data into a web component.
 */
export abstract class TraitRenderer {
  abstract render(data: Record<string, unknown>): HTMLElement
}
