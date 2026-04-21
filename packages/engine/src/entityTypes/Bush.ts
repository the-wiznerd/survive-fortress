import { BaseEntityType } from '~engine/entityTypes/BaseEntityType.js'
import { OccludingTrait } from '~engine/traits/OccludingTrait.js'
import { MaterialTrait } from '~engine/traits/MaterialTrait.js'

type BushSize = 'large' | 'small'

export class Bush extends BaseEntityType {
  type = 'bush'
  occluding = this.addTrait(new OccludingTrait(this.world, this.id))
  material = this.addTrait(new MaterialTrait(this.world, this.id, 'solid'))
  size: BushSize = 'large'
  berryYield = 4

  init(state: Record<string, unknown>): void {
    super.init(state)
    const savedSize = state.size
    if (savedSize === 'small' || savedSize === 'large') this.size = savedSize
    this.berryYield = this.size === 'small' ? 2 : 4
  }

  export(): Record<string, unknown> {
    const saved = super.export()
    saved.size = this.size
    return saved
  }
}
