import {
  getComponent,
  type World,
  type EntityId,
  type Container,
  type EntitySave,
} from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'
import { spawnEntity } from '~engine/registry.js'
import { transferToContainer } from '~engine/containment.js'
import type { BaseEntityType } from '~engine/entityTypes/BaseEntityType.js'

/**
 * Holds other entities. Capacity is measured in Carriable.size units —
 * a 10-capacity bag can hold ten size-1 berries or two size-5 axes.
 *
 * `contents` stores live entity ids at runtime; on serialization the trait
 * emits the children's full nested EntitySave records and rebuilds them on load.
 */
export class ContainerTrait extends Trait<'container'> {
  readonly component = 'container' as const
  declare capacity: number
  declare contents: EntityId[]

  constructor(world: World, entityId: EntityId, private readonly initial: Partial<Pick<Container, 'capacity'>> = {}) {
    super(world, entityId)
  }

  defaults(): Container {
    return { capacity: 0, contents: [], ...this.initial }
  }

  /** Total effective Carriable size of currently-held contents (accounts for stacks). */
  get usedCapacity(): number {
    let total = 0
    for (const id of this.contents) {
      const c = getComponent(this.world, id, 'carriable')
      if (!c) continue
      const stack = getComponent(this.world, id, 'stackable')
      total += c.size * (stack?.count ?? 1)
    }
    return total
  }

  /** Whether an item with the given size will fit. */
  canFit(size: number): boolean {
    return this.usedCapacity + size <= this.capacity
  }

  /** Custom save: nest each child's full EntitySave under `contents`. */
  save(): unknown {
    const result: Record<string, unknown> = {}
    let hasOwn = false

    const d = this.defaults()
    if (this.capacity !== d.capacity) {
      result.capacity = this.capacity
      hasOwn = true
    }

    if (this.contents.length > 0) {
      const nested: EntitySave[] = []
      for (const id of this.contents) {
        const inst = getComponent(this.world, id, 'instance')
        if (!inst) continue
        nested.push((inst.ref as BaseEntityType).export() as EntitySave)
      }
      result.contents = nested
      hasOwn = true
    }

    return hasOwn ? result : undefined
  }

  /** Custom init: spawn each saved child and transfer it into this container. */
  init(saved?: Record<string, unknown>): void {
    // Strip `contents` before super.init so the base trait machinery doesn't try to assign it.
    const { contents: savedContents, ...rest } = (saved ?? {}) as { contents?: EntitySave[] } & Record<string, unknown>
    super.init(rest)

    if (savedContents && Array.isArray(savedContents)) {
      for (const childSave of savedContents) {
        if (!childSave.entityType) continue
        const child = spawnEntity(this.world, childSave.entityType, childSave as unknown as Record<string, unknown>)
        transferToContainer(this.world, child.id, this.entityId)
      }
    }
  }
}
