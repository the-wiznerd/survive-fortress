import { queryEntities, getComponent, type World } from '@repo/state'
import { BaseEntityType } from '~engine/entityTypes/BaseEntityType.js'

export function entityTypeTickSystem(world: World) {
  for (const id of queryEntities(world, 'instance')) {
    (getComponent(world, id, 'instance')!.ref as BaseEntityType).tick()
  }
}
