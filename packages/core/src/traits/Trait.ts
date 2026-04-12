export abstract class Trait<K extends ComponentName> {
  abstract readonly component: K
  readonly world: World
  readonly entityId: EntityId

  constructor(world: World, entityId: EntityId) {
    this.world = world
    this.entityId = entityId
  }

  abstract defaults(): ComponentTypes[K]

  get data(): ComponentTypes[K] {
    return getComponent(this.world, this.entityId, this.component)!
  }

  get position(): Position {
    return getComponent(this.world, this.entityId, 'position')!
  }

  init(saved?: Record<string, unknown>): void {
    const d = this.defaults()
    addComponent(this.world, this.entityId, this.component,
      saved ? { ...d, ...saved } as ComponentTypes[K] : d)
  }

  save(): unknown {
    const data = this.data
    const d = this.defaults()
    const changed = Object.keys(d as object).some(
      key => (data as unknown as Record<string, unknown>)[key] !== (d as unknown as Record<string, unknown>)[key],
    )
    return changed ? { ...data } : undefined
  }
}
