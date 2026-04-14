import { addComponent, type World, type EntityId, type ComponentName, type ComponentTypes } from '@repo/state'

export abstract class Trait<K extends ComponentName> {
  abstract readonly component: K
  readonly world: World
  readonly entityId: EntityId

  constructor(world: World, entityId: EntityId) {
    this.world = world
    this.entityId = entityId
  }

  abstract defaults(): ComponentTypes[K]

  init(saved?: Record<string, unknown>): void {
    const d = this.defaults()
    Object.assign(this, d, saved)
    addComponent(this.world, this.entityId, this.component, this as unknown as ComponentTypes[K])
  }

  save(): unknown {
    const d = this.defaults()
    const keys = Object.keys(d as object)
    const changed = keys.some(
      key => (this as unknown as Record<string, unknown>)[key] !== (d as unknown as Record<string, unknown>)[key],
    )
    if (!changed) return undefined
    const result: Record<string, unknown> = {}
    for (const key of keys) {
      result[key] = (this as unknown as Record<string, unknown>)[key]
    }
    return result
  }
}
