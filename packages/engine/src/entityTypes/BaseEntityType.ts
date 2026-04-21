import type { World, EntityId, ComponentName } from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'
import { PositionTrait } from '~engine/traits/PositionTrait.js'

export abstract class BaseEntityType {
  abstract type: string

  readonly traits: Trait<ComponentName>[] = []
  position: PositionTrait

  constructor(public world: World, public id: EntityId) {
    this.position = this.addTrait(new PositionTrait(world, id))
  }

  /** Register a trait — stores it for auto-iteration and returns it for assignment. */
  protected addTrait<T extends Trait<ComponentName>>(trait: T): T {
    this.traits.push(trait)
    return trait
  }

  /** Initialize all traits from saved state. */
  init(state: Record<string, unknown>): void {
    for (const t of this.traits) {
      const component = t.component
      t.init(component ? state[component] as Record<string, unknown> | undefined : undefined)
    }
  }

  /** Auto-export: iterates all traits, no manual list needed. */
  export(): Record<string, unknown> {
    const result: Record<string, unknown> = { entityType: this.type }
    for (const t of this.traits) {
      const saved = t.save()
      const component = t.component
      if (saved !== undefined && component) result[component] = saved
    }
    return result
  }

  /** Called each tick for entity-specific behavior. Override in subclasses. */
  tick(): void { }
}
