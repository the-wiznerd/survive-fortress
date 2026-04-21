import { BaseEntityType } from '~engine/entityTypes/BaseEntityType.js'
import { OccludingTrait } from '~engine/traits/OccludingTrait.js'
import { MaterialTrait } from '~engine/traits/MaterialTrait.js'
import { HarvestableTrait } from '~engine/traits/HarvestableTrait.js'

type BushSize = 'large' | 'small'

export class Bush extends BaseEntityType {
  type = 'bush'
  occluding = this.addTrait(new OccludingTrait(this.world, this.id))
  material = this.addTrait(new MaterialTrait(this.world, this.id, 'solid'))
  harvestable = this.addTrait(new HarvestableTrait(this.world, this.id))
  size: BushSize = 'large'
  berryYield = 4

  init(state: Record<string, unknown>): void {
    super.init(state)
    const savedSize = state.size
    if (savedSize === 'small' || savedSize === 'large') this.size = savedSize
    this.berryYield = this.size === 'small' ? 4 : 8
    this.harvestable.amount = this.berryYield
    this.harvestable.onHarvest = (harvesterId) => {
      console.log(`[Bush] Harvested ${this.harvestable.amount} berries by entity ${harvesterId}`)
      this.harvestable.amount = 0
    }
  }

  export(): Record<string, unknown> {
    const saved = super.export()
    saved.size = this.size
    return saved
  }
}
