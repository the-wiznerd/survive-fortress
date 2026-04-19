import type { World, EntityId, Material, MaterialType } from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'

export class MaterialTrait extends Trait<'material'> {
  readonly component = 'material' as const
  declare material: MaterialType

  constructor(world: World, entityId: EntityId, private type: MaterialType = 'solid') {
    super(world, entityId)
  }

  defaults(): Material {
    return { material: this.type }
  }
}
