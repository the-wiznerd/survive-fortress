import { describe, it, expect } from 'vitest'
import { createWorld, getComponent } from '@sf/state'

registerEntityType('player', Player)

/** Convenience: spawn a player at (x, y) using the registry. */
function spawnPlayer(world: ReturnType<typeof createWorld>, x: number, y: number) {
  return spawnEntity(world, 'player', { entityType: 'player', position: { x, y, z: 0 } }).id
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
    expect(getComponent(a, 1, 'health')).toEqual(getComponent(b, 1, 'health'))
    expect(getComponent(a, 1, 'hunger')).toEqual(getComponent(b, 1, 'hunger'))
    expect(getComponent(a, 1, 'position')).toEqual(getComponent(b, 1, 'position'))
  })
})

describe('movement system', () => {
  it('moves player when action submitted and AP sufficient', () => {
    const world = createWorld()
    const player = spawnPlayer(world, 10, 10)

    // Player has apPerTick: 10, MOVE_COST: 10 → can move every tick.
    const pc = getComponent(world, player, 'playerControlled')!
    pc.pendingAction = { type: 'move', dx: 1, dy: 0 }

    tick(world)

    const pos = getComponent(world, player, 'position')!
    expect(pos.x).toBe(11)
    expect(pos.y).toBe(10)
  })

  it('respects pace for slow entities', () => {
    const world = createWorld()
    const player = spawnPlayer(world, 10, 10)

    // Slow down the player: move once every 3 ticks.
    getComponent(world, player, 'speed')!.pace = 3

    // Tick 0 (world.tick starts at 0): 0 % 3 === 0, can move.
    const pc = getComponent(world, player, 'playerControlled')!
    pc.pendingAction = { type: 'move', dx: 1, dy: 0 }
    tick(world)
    expect(getComponent(world, player, 'position')!.x).toBe(11)

    // Tick 1: 1 % 3 !== 0, can't move.
    pc.pendingAction = { type: 'move', dx: 1, dy: 0 }
    tick(world)
    expect(getComponent(world, player, 'position')!.x).toBe(11)

    // Tick 2: 2 % 3 !== 0, can't move.
    pc.pendingAction = { type: 'move', dx: 1, dy: 0 }
    tick(world)
    expect(getComponent(world, player, 'position')!.x).toBe(11)

    // Tick 3: 3 % 3 === 0, moves again.
    pc.pendingAction = { type: 'move', dx: 1, dy: 0 }
    tick(world)
    expect(getComponent(world, player, 'position')!.x).toBe(12)
  })

  it('clears pending action after processing', () => {
    const world = createWorld()
    const player = spawnPlayer(world, 10, 10)

    const pc = getComponent(world, player, 'playerControlled')!
    pc.pendingAction = { type: 'move', dx: 1, dy: 0 }
    tick(world)

    expect(pc.pendingAction).toBeNull()

    // Next tick with no input: player doesn't move.
    tick(world)
    expect(getComponent(world, player, 'position')!.x).toBe(11)
  })
})
