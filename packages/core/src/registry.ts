// ─── Entity Type Definition ───

export interface EntityTypeDef {
  type: string
  export(world: World, id: EntityId): Record<string, unknown>
  import(world: World, id: EntityId, state: Record<string, unknown>): void
  tick?(world: World, id: EntityId): void
}

// ─── Base Class ───

import type { Trait } from './traits/Trait.js'
import { EntityTypeTrait } from './traits/EntityTypeTrait.js'
import { PositionTrait } from './traits/PositionTrait.js'

export abstract class BaseEntityType implements EntityTypeDef {
  abstract type: string

  private entities = new Map<EntityId, Trait<any>[]>()

  protected createTraits(_world: World, _id: EntityId): Trait<any>[] {
    return []
  }

  import(world: World, id: EntityId, state: Record<string, unknown>): void {
    const entityTypeTrait = new EntityTypeTrait(world, id, this.type)
    const positionTrait = new PositionTrait(world, id)
    const custom = this.createTraits(world, id)
    const traits = [entityTypeTrait, positionTrait, ...custom]

    for (const t of traits) {
      t.init(state[t.component] as Record<string, unknown> | undefined)
    }
    this.entities.set(id, traits)
  }

  export(_world: World, id: EntityId): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    const traits = this.entities.get(id)
    if (!traits) return result
    for (const t of traits) {
      const saved = t.save()
      if (saved !== undefined) result[t.component] = saved
    }
    return result
  }

  trait<K extends ComponentName>(id: EntityId, component: K): Trait<K> | undefined {
    return this.entities.get(id)?.find(t => t.component === component) as Trait<K> | undefined
  }

  destroyTraits(id: EntityId): void {
    this.entities.delete(id)
  }
}

// ─── Registry ───

const registry = new Map<string, EntityTypeDef>()

export function registerEntityType(def: EntityTypeDef): void {
  registry.set(def.type, def)
}

export function getEntityTypeDef(type: string): EntityTypeDef | undefined {
  return registry.get(type)
}

export function getRegisteredTypes(): string[] {
  return [...registry.keys()]
}
