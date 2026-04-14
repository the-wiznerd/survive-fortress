export function entityTypeTickSystem(world: World) {
  for (const id of queryEntities(world, 'instance')) {
    (getComponent(world, id, 'instance')!.ref as BaseEntityType).tick()
  }
}
