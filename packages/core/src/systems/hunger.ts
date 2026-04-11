export const hungerSystem: System = (world) => {
  for (const id of queryEntities(world, 'hunger')) {
    const hunger = getComponent(world, id, 'hunger')!
    hunger.current = Math.max(0, hunger.current - hunger.drainPerTick)

    if (hunger.current === 0) {
      const health = getComponent(world, id, 'health')
      if (health) {
        health.current = Math.max(0, health.current - 1)
      }
    }
  }
}
