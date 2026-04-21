import {
  getComponent,
  type World,
  type EntityId,
  type Equipment,
  type EntitySave,
} from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'
import { spawnEntity } from '~engine/registry.js'
import { equipItem } from '~engine/containment.js'
import type { BaseEntityType } from '~engine/entityTypes/BaseEntityType.js'

/**
 * Named equipment slots on an entity (hands, back, head, etc). Each slot holds
 * at most one Wearable item. Slot names are configured by the owning entity
 * type via the constructor.
 *
 * Like ContainerTrait, Equipment owns its children's persistence: the nested
 * EntitySave for each occupied slot is emitted in `save()` and rebuilt in
 * `init()`.
 */
export class EquipmentTrait extends Trait<'equipment'> {
  readonly component = 'equipment' as const
  declare slots: Record<string, EntityId | null>

  constructor(
    world: World,
    entityId: EntityId,
    private readonly slotNames: string[] = [],
  ) {
    super(world, entityId)
  }

  defaults(): Equipment {
    const slots: Record<string, EntityId | null> = {}
    for (const name of this.slotNames) slots[name] = null
    return { slots }
  }

  /** Returns the entity equipped in the given slot, or null. */
  get(slot: string): EntityId | null {
    return this.slots[slot] ?? null
  }

  /** Custom save: serialize the slot structure itself AND emit nested EntitySave
   *  for each occupied slot. Always returns an object so the presence of the
   *  `equipment` key in a saved state distinguishes "previously-saved player"
   *  from "brand-new player". */
  save(): unknown {
    const savedSlots: Record<string, EntitySave | null> = {}
    for (const [slot, id] of Object.entries(this.slots)) {
      if (id === null) {
        savedSlots[slot] = null
        continue
      }
      const inst = getComponent(this.world, id, 'instance')
      if (!inst) continue
      savedSlots[slot] = (inst.ref as BaseEntityType).export() as EntitySave
    }
    return { slots: savedSlots }
  }

  /** Custom init: respawn any items that were equipped at save time and equip them. */
  init(saved?: Record<string, unknown>): void {
    const { slots: savedSlots, ...rest } = (saved ?? {}) as { slots?: Record<string, EntitySave | null> } & Record<string, unknown>
    super.init(rest)

    if (!savedSlots) return
    for (const [slot, childSave] of Object.entries(savedSlots)) {
      if (!childSave || !childSave.entityType) continue
      const child = spawnEntity(this.world, childSave.entityType, childSave as unknown as Record<string, unknown>)
      equipItem(this.world, child.id, this.entityId, slot)
    }
  }
}
