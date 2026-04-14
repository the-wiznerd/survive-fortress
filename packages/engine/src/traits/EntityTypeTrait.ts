export class EntityTypeTrait extends Trait<'entityType'> {
  readonly component = 'entityType' as const
  declare type: string

  constructor(world: World, entityId: EntityId, private typeName: string) {
    super(world, entityId)
  }

  defaults(): EntityType {
    return { type: this.typeName }
  }

  init(saved?: unknown): void {
    const type = typeof saved === 'string' ? saved : this.typeName
    Object.assign(this, { type })
    addComponent(this.world, this.entityId, this.component, this as unknown as EntityType)
  }

  save(): string {
    return this.type
  }
}
