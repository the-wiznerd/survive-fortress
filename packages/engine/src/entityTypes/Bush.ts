import { BaseEntityType } from '~engine/entityTypes/BaseEntityType.js'
import { OccludingTrait } from '~engine/traits/OccludingTrait.js'
import { MaterialTrait } from '~engine/traits/MaterialTrait.js'
import { HarvestableTrait } from '~engine/traits/HarvestableTrait.js'
import { spawnEntity } from '~engine/registry.js'
import { transferToContainer, getActorContainer } from '~engine/containment.js'
import { getComponent } from '@repo/state'

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
    this.harvestable.cost = this.size === 'small' ? 2 : 3
    this.harvestable.onHarvest = (harvesterId) => {
      const yielded = this.harvestable.amount
      this.harvestable.amount = 0
      this.spawnBerries(harvesterId, yielded)
    }
  }

  /**
   * Spawn `count` berries and try to deliver them to the harvester's primary
   * container (e.g. their equipped bag). Any berries that don't fit drop onto
   * the harvester's tile — the bush's own tile is occupied (solid material).
   */
  private spawnBerries(harvesterId: number, count: number): void {
    const harvesterPos = getComponent(this.world, harvesterId, 'position')
    const containerId = getActorContainer(this.world, harvesterId)

    for (let i = 0; i < count; i++) {
      const berry = spawnEntity(this.world, 'berry', { entityType: 'berry', position: { x: 0, y: 0, z: 0 } })

      const placed = containerId !== undefined && transferToContainer(this.world, berry.id, containerId)
      if (!placed && harvesterPos) {
        const pos = getComponent(this.world, berry.id, 'position')
        if (pos) {
          pos.x = harvesterPos.x
          pos.y = harvesterPos.y
          pos.z = harvesterPos.z
        }
      }
    }
  }

  export(): Record<string, unknown> {
    const saved = super.export()
    saved.size = this.size
    return saved
  }
}
