import type { World, EntityId } from '@repo/state'
import { Trait } from '~engine/traits/Trait.js'

export class TickCounter extends Trait {
  declare counter: number
  declare threshold: number

  constructor(world: World, entityId: EntityId, private readonly defaultThreshold: number) {
    super(world, entityId)
  }

  defaults() {
    return { counter: 0, threshold: this.defaultThreshold }
  }

  tick(): void {
    if (this.counter < this.threshold) this.counter++
  }

  get ready(): boolean {
    return this.counter >= this.threshold
  }

  reset(): void {
    this.counter = 0
  }
}
