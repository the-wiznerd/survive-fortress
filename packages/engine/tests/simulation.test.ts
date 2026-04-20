import { describe, it, expect } from 'vitest'
import { createWorld, getComponent, createEntity, addComponent, setPosition } from '@repo/state'
import { registerEntityType, spawnEntity } from '~engine/registry.js'
import { Player } from '~engine/entityTypes/Player.js'
import { tick, simulate } from '~engine/tick.js'

registerEntityType('player', Player)

/** Convenience: spawn a player at (x, y) using the registry. */
function spawnPlayer(world: ReturnType<typeof createWorld>, x: number, y: number) {
  return spawnEntity(world, 'player', { entityType: 'player', position: { x, y, z: 0 } }).id
}

/** Place a solid ground tile at (x, y, z). Walk locomotion needs solid floor at z-1. */
function placeGround(world: ReturnType<typeof createWorld>, x: number, y: number, z: number) {
  const id = createEntity(world)
  setPosition(world, id, x, y, z)
  addComponent(world, id, 'material', { material: 'solid' })
  return id
}

describe('hunger system', () => {
  it('drains hunger by 1 each tick', () => {
    const world = createWorld()
    const player = spawnPlayer(world, 0, 0)

    expect(getComponent(world, player, 'hunger')!.current).toBe(100)

    tick(world)
    expect(getComponent(world, player, 'hunger')!.current).toBe(99)

    tick(world)
    expect(getComponent(world, player, 'hunger')!.current).toBe(98)
  })

  it('drains health when hunger reaches 0', () => {
    const world = createWorld()
    const player = spawnPlayer(world, 0, 0)

    // After 99 ticks: hunger=1, health untouched.
    simulate(world, 99)
    expect(getComponent(world, player, 'hunger')!.current).toBe(1)
    expect(getComponent(world, player, 'health')!.current).toBe(100)

    // Tick 100: hunger drops to 0, health takes 1 damage immediately.
    tick(world)
    expect(getComponent(world, player, 'hunger')!.current).toBe(0)
    expect(getComponent(world, player, 'health')!.current).toBe(99)

    // Tick 101: hunger stays 0, health drops again.
    tick(world)
    expect(getComponent(world, player, 'health')!.current).toBe(98)
  })

  it('is perfectly deterministic across runs', () => {
    function runSim() {
      const world = createWorld()
      spawnPlayer(world, 5, 5)
      simulate(world, 150)
      return world
    }

    const a = runSim()
    const b = runSim()

    expect(a.tick).toBe(b.tick)

    const ha = getComponent(a, 1, 'health')!
    const hb = getComponent(b, 1, 'health')!
    expect(ha.current).toBe(hb.current)
    expect(ha.max).toBe(hb.max)

    const ua = getComponent(a, 1, 'hunger')!
    const ub = getComponent(b, 1, 'hunger')!
    expect(ua.current).toBe(ub.current)
    expect(ua.max).toBe(ub.max)

    const pa = getComponent(a, 1, 'position')!
    const pb = getComponent(b, 1, 'position')!
    expect(pa.x).toBe(pb.x)
    expect(pa.y).toBe(pb.y)
    expect(pa.z).toBe(pb.z)
  })
})

describe('movement system', () => {
  it('moves player when plan submitted and timer ready', () => {
    const world = createWorld()
    const player = spawnPlayer(world, 10, 10)

    // Place solid ground at z=-1 for the start and destination.
    placeGround(world, 10, 10, -1)
    placeGround(world, 11, 10, -1)

    // Player pace=1: ready after 1 tick.
    simulate(world, 1)

    const pc = getComponent(world, player, 'playerControlled')!
    pc.plan = [{ type: 'move', dx: 1, dy: 0 }]
    pc.planIndex = 0

    tick(world)

    const pos = getComponent(world, player, 'position')!
    expect(pos.x).toBe(11)
    expect(pos.y).toBe(10)
  })

  it('respects pace for slow entities', () => {
    const world = createWorld()
    const player = spawnPlayer(world, 10, 10)

    // Place ground along the path.
    for (let x = 10; x <= 12; x++) placeGround(world, x, 10, -1)

    // Override pace to 3 so we can test the timer.
    const movement = getComponent(world, player, 'movement')!
    movement.modes[0].pace = 3

    const pc = getComponent(world, player, 'playerControlled')!
    pc.plan = [
      { type: 'move', dx: 1, dy: 0 },
      { type: 'move', dx: 1, dy: 0 },
    ]
    pc.planIndex = 0

    // Ticks 1-2: timer filling, not ready yet.
    tick(world) // counter: 1
    expect(getComponent(world, player, 'position')!.x).toBe(10)

    tick(world) // counter: 2
    expect(getComponent(world, player, 'position')!.x).toBe(10)

    tick(world) // counter: 3 → ready, moves, resets to 0
    expect(getComponent(world, player, 'position')!.x).toBe(11)
    expect(pc.planIndex).toBe(1)

    // Immediately after move: counter reset to 0, can't move again.
    tick(world) // counter: 1
    expect(getComponent(world, player, 'position')!.x).toBe(11)

    // Fill up again.
    tick(world) // counter: 2
    tick(world) // counter: 3 → ready, moves
    expect(getComponent(world, player, 'position')!.x).toBe(12)
    expect(pc.planIndex).toBe(2)
  })

  it('idles when plan is exhausted', () => {
    const world = createWorld()
    const player = spawnPlayer(world, 10, 10)

    // Place ground for start and destination.
    placeGround(world, 10, 10, -1)
    placeGround(world, 11, 10, -1)

    // Fill the movement timer (pace=1).
    simulate(world, 1)

    const pc = getComponent(world, player, 'playerControlled')!
    pc.plan = [{ type: 'move', dx: 1, dy: 0 }]
    pc.planIndex = 0
    tick(world)

    expect(pc.planIndex).toBe(1)

    // Plan exhausted — further ticks don't move.
    simulate(world, 3)
    tick(world)
    expect(getComponent(world, player, 'position')!.x).toBe(11)
  })
})
