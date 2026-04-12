export function entityTypeTickSystem(world: World) {
  for (const id of queryEntities(world, 'entityType')) {
    const typeName = getComponent(world, id, 'entityType')!.type
    const def = getEntityTypeDef(typeName)
    if (def?.tick) {
      def.tick(world, id)
    }
  }
}
