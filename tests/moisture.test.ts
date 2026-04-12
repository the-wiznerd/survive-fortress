import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  registerEntityType('dirt', Dirt)
  registerEntityType('grass', Grass)
})

/** Place a tile with moisture at (x, y). */
function placeMoist(world: World, x: number, y: number, current: number, capacity = 100, conductivity = 10) {
  const id = createEntity(world)
  addComponent(world, id, 'position', { x, y, z: 0 })
  addComponent(world, id, 'moisture', { current, capacity, conductivity })
  return id
}

describe('moisture system', () => {
  it('equalizes between two adjacent tiles', () => {
    const world = createWorld()
    const a = placeMoist(world, 0, 0, 100, 100, 20)
    const b = placeMoist(world, 1, 0, 0, 100, 20)

    moistureSystem(world)

    // diff=100, rate=min(20,20)=20, transfer = intDiv(100*20, 200) = 10
    expect(getComponent(world, a, 'moisture')!.current).toBe(90)
    expect(getComponent(world, b, 'moisture')!.current).toBe(10)
  })

  it('transfers nothing between equal tiles', () => {
    const world = createWorld()
    const a = placeMoist(world, 0, 0, 50)
    const b = placeMoist(world, 1, 0, 50)

    moistureSystem(world)

    expect(getComponent(world, a, 'moisture')!.current).toBe(50)
    expect(getComponent(world, b, 'moisture')!.current).toBe(50)
  })

  it('is rate-limited by the slower tile', () => {
    const world = createWorld()
    const a = placeMoist(world, 0, 0, 80, 100, 50)
    const b = placeMoist(world, 1, 0, 0, 100, 20)

    moistureSystem(world)

    // diff=80, rate=min(50,20)=20, transfer = intDiv(80*20, 200) = 8
    expect(getComponent(world, a, 'moisture')!.current).toBe(72)
    expect(getComponent(world, b, 'moisture')!.current).toBe(8)
  })

  it('clamps to capacity', () => {
    const world = createWorld()
    const a = placeMoist(world, 0, 0, 100, 100, 50)
    const b = placeMoist(world, 1, 0, 80, 85, 50)

    // diff=20, rate=50, transfer = intDiv(20*50, 200) = 5  →  B would go to 85 but capacity=85
    moistureSystem(world)

    expect(getComponent(world, b, 'moisture')!.current).toBe(85)
  })

  it('clamps to zero (no negative moisture)', () => {
    const world = createWorld()
    const a = placeMoist(world, 0, 0, 2, 100, 50)
    const b = placeMoist(world, 1, 0, 100, 100, 50)

    // diff=-98, transfer = intDiv(-98*50, 200) = -24  →  A gains 24 → 26, B loses 24 → 76
    moistureSystem(world)

    expect(getComponent(world, a, 'moisture')!.current).toBe(26)
    expect(getComponent(world, b, 'moisture')!.current).toBe(76)
  })

  it('does not transfer between non-adjacent tiles', () => {
    const world = createWorld()
    const a = placeMoist(world, 0, 0, 100)
    const b = placeMoist(world, 2, 0, 0) // gap at (1,0)

    moistureSystem(world)

    expect(getComponent(world, a, 'moisture')!.current).toBe(100)
    expect(getComponent(world, b, 'moisture')!.current).toBe(0)
  })

  it('transfers proportionally to the gradient', () => {
    const world = createWorld()
    // Large gradient (isolated pair)
    const a1 = placeMoist(world, 0, 0, 100, 100, 10)
    const b1 = placeMoist(world, 1, 0, 0, 100, 10)
    // Small gradient (isolated pair, far away)
    const a2 = placeMoist(world, 0, 5, 20, 100, 10)
    const b2 = placeMoist(world, 1, 5, 0, 100, 10)

    moistureSystem(world)

    // diff=100, transfer = intDiv(100*10, 200) = 5
    expect(getComponent(world, a1, 'moisture')!.current).toBe(95)
    expect(getComponent(world, b1, 'moisture')!.current).toBe(5)
    // diff=20, transfer = intDiv(20*10, 200) = 1
    expect(getComponent(world, a2, 'moisture')!.current).toBe(19)
    expect(getComponent(world, b2, 'moisture')!.current).toBe(1)
  })

  it('handles a 3-tile chain with Jacobi (simultaneous) updates', () => {
    const world = createWorld()
    const a = placeMoist(world, 0, 0, 100, 100, 20)
    const b = placeMoist(world, 1, 0, 0, 100, 20)
    const c = placeMoist(world, 2, 0, 0, 100, 20)

    moistureSystem(world)

    // Face A↔B: diff=100, transfer = intDiv(100*20, 200) = 10  → A:-10, B:+10
    // Face B↔C: diff=0, transfer = 0
    expect(getComponent(world, a, 'moisture')!.current).toBe(90)
    expect(getComponent(world, b, 'moisture')!.current).toBe(10)
    expect(getComponent(world, c, 'moisture')!.current).toBe(0)

    // Second tick: A↔B diff=80 → intDiv(80*20,200)=8; B↔C diff=10 → intDiv(10*20,200)=1
    // Net: A: -8 = 82, B: +8-1 = 17, C: +1 = 1
    moistureSystem(world)

    expect(getComponent(world, a, 'moisture')!.current).toBe(82)
    expect(getComponent(world, b, 'moisture')!.current).toBe(17)
    expect(getComponent(world, c, 'moisture')!.current).toBe(1)
  })

  it('works on both axes (right and down neighbors)', () => {
    const world = createWorld()
    //  A(100) — B(0)
    //  |
    //  C(0)
    const a = placeMoist(world, 0, 0, 100, 100, 20)
    const b = placeMoist(world, 1, 0, 0, 100, 20)
    const c = placeMoist(world, 0, 1, 0, 100, 20)

    moistureSystem(world)

    // A↔B diff=100, transfer=10; A↔C diff=100, transfer=10 → A: -20
    expect(getComponent(world, a, 'moisture')!.current).toBe(80)
    expect(getComponent(world, b, 'moisture')!.current).toBe(10)
    expect(getComponent(world, c, 'moisture')!.current).toBe(10)
  })

  it('is perfectly deterministic across runs', () => {
    function runSim() {
      const world = createWorld()
      placeMoist(world, 0, 0, 100, 100, 30)
      placeMoist(world, 1, 0, 0, 100, 30)
      placeMoist(world, 0, 1, 50, 80, 20)
      placeMoist(world, 1, 1, 20, 60, 40)
      for (let i = 0; i < 50; i++) moistureSystem(world)
      return world
    }

    const a = runSim()
    const b = runSim()

    for (let id = 1; id <= 4; id++) {
      expect(getComponent(a, id, 'moisture')).toEqual(getComponent(b, id, 'moisture'))
    }
  })
})

describe('dirt → grass spawning', () => {
  /** Place a dirt tile via the registry. */
  function placeDirt(world: World, x: number, y: number) {
    return spawnEntity(world, 'dirt', {
      entityType: 'dirt',
      position: { x, y, z: 0 },
    }).id
  }

  it('spawns grass at z+1 when moisture reaches threshold', () => {
    const world = createWorld()
    const dirt = placeDirt(world, 5, 5)

    // Set moisture above threshold (3)
    getComponent(world, dirt, 'moisture')!.current = 5

    // Run one full tick (moisture system + entity type tick)
    tick(world)

    const above = getEntitiesAt(world, 5, 5, 1)
    expect(above).toHaveLength(1)
    expect(getComponent(world, above[0], 'entityType')!.type).toBe('grass')
  })

  it('does not spawn grass below threshold', () => {
    const world = createWorld()
    const dirt = placeDirt(world, 5, 5)

    getComponent(world, dirt, 'moisture')!.current = 2

    tick(world)

    const above = getEntitiesAt(world, 5, 5, 1)
    expect(above).toHaveLength(0)
  })

  it('does not spawn duplicate grass', () => {
    const world = createWorld()
    const dirt = placeDirt(world, 5, 5)

    getComponent(world, dirt, 'moisture')!.current = 10

    tick(world)
    tick(world)
    tick(world)

    const above = getEntitiesAt(world, 5, 5, 1)
    expect(above).toHaveLength(1)
  })

  it('dirt keeps its moisture after spawning grass', () => {
    const world = createWorld()
    const dirt = placeDirt(world, 5, 5)

    getComponent(world, dirt, 'moisture')!.current = 10

    tick(world)

    expect(getComponent(world, dirt, 'moisture')).toBeDefined()
    expect(getComponent(world, dirt, 'entityType')!.type).toBe('dirt')
  })
})
