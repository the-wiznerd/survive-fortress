import { addComponent, type World, type EntityId, type ComponentName, type ComponentTypes } from '@repo/state'

export abstract class Trait<K extends string = string> {
  readonly component?: K & ComponentName
  readonly world: World
  readonly entityId: EntityId

  private subTraits?: Map<string, Trait>

  constructor(world: World, entityId: EntityId) {
    this.world = world
    this.entityId = entityId
  }

  abstract defaults(): K extends ComponentName ? ComponentTypes[K] : Record<string, unknown>

  /** Register a sub-trait under a serialization key. */
  protected addSubTrait<T extends Trait>(key: string, sub: T): T {
    if (!this.subTraits) this.subTraits = new Map()
    this.subTraits.set(key, sub)
    return sub
  }

  init(saved?: Record<string, unknown>): void {
    const d = this.defaults() as Record<string, unknown>
    Object.assign(this, d, saved ? this.ownFields(saved) : undefined)

    // Recursively init sub-traits.
    if (this.subTraits) {
      for (const [key, sub] of this.subTraits) {
        sub.init(saved?.[key] as Record<string, unknown> | undefined)
      }
    }

    // Register in ECS if this is a top-level trait.
    if (this.component !== undefined) {
      addComponent(this.world, this.entityId, this.component, this as unknown as ComponentTypes[K & ComponentName])
    }
  }

  save(): unknown {
    const d = this.defaults() as Record<string, unknown>
    const keys = Object.keys(d)

    // Collect own changed fields.
    const self = this as unknown as Record<string, unknown>
    const dRec = d as Record<string, unknown>
    const result: Record<string, unknown> = {}
    let hasOwn = false
    for (const key of keys) {
      if (self[key] !== dRec[key]) hasOwn = true
      result[key] = self[key]
    }

    // Recursively save sub-traits.
    let hasSub = false
    if (this.subTraits) {
      for (const [key, sub] of this.subTraits) {
        const subSaved = sub.save()
        if (subSaved !== undefined) {
          result[key] = subSaved
          hasSub = true
        }
      }
    }

    return (hasOwn || hasSub) ? result : undefined
  }

  /** Extract only own-data keys from a saved record (excludes sub-trait keys). */
  private ownFields(saved: Record<string, unknown>): Record<string, unknown> {
    if (!this.subTraits) return saved
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(saved)) {
      if (!this.subTraits.has(key)) result[key] = saved[key]
    }
    return result
  }
}
