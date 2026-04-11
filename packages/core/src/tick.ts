export type System = (world: World) => void

// ─── Tick Engine ───

const defaultSystems: System[] = [movementSystem, hungerSystem, moistureSystem, entityTypeTickSystem]

export function tick(world: World, systems: System[] = defaultSystems): void {
  for (const system of systems) {
    system(world)
  }
  world.tick++
}

/** Run multiple ticks. */
export function simulate(
  world: World,
  ticks: number,
  systems?: System[],
): void {
  for (let i = 0; i < ticks; i++) {
    tick(world, systems)
  }
}
