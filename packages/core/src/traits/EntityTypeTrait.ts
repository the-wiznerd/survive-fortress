import { Trait } from './Trait.js'

export class EntityTypeTrait extends Trait<'entityType'> {
  readonly component = 'entityType' as const

  constructor(world: World, entityId: EntityId, private typeName: string) {
    super(world, entityId)
  }

  defaults(): EntityType {
    return { type: this.typeName }
  }

  init(saved?: unknown): void {
    const type = typeof saved === 'string' ? saved : this.typeName
    addComponent(this.world, this.entityId, this.component, { type })
  }

  save(): string {
    return this.data.type
  }
}
