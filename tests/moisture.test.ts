import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  registerEntityType(new Dirt())
  registerEntityType(new Grass())
})

/** Place a tile with moisture at (x, y). */
function placeMoist(world: World, x: number, y: number, current: number, capacity = 100, rate = 1) {
  const id = createEntity(world)
  addComponent(world, id, 'position', { x, y, z: 0 })
  addComponent(world, id, 'moisture', { current, capacity, rate })
  return id
}

describe('moisture system', () => {
  it('equalizes between two adjacent tiles', () => {
    const world = createWorld()
    const a = placeMoist(world, 0, 0, 10)
    const b = placeMoist(world, 1, 0, 0)

    moistureSystem(world)

    // Transfer = min(|10-0|/2, rate=1) = 1  →  A loses 1, B gains 1
    expect(getComponent(world, a, 'moisture')!.current).toBe(9)
    expect(getComponent(world, b, 'moisture')!.current).toBe(1)
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
    const a = placeMoist(world, 0, 0, 80, 100, 5)
    const b = placeMoist(world, 1, 0, 0, 100, 2)

    moistureSystem(world)

    // rate = min(5, 2) = 2; diff/2 = 40; transfer = min(40, 2) = 2
    expect(getComponent(world, a, 'moisture')!.current).toBe(78)
    expect(getComponent(world, b, 'moisture')!.current).toBe(2)
  })

  it('clamps to capacity', () => {
    const world = createWorld()
    const a = placeMoist(world, 0, 0, 100, 100, 50)
    const b = placeMoist(world, 1, 0, 90, 92, 50)

    // diff = 10, transfer = min(5, 50) = 5  →  B would go to 95 but capacity=92
    moistureSystem(world)

    expect(getComponent(world, b, 'moisture')!.current).toBe(92)
  })

  it('clamps to zero (no negative moisture)', () => {
    const world = createWorld()
    const a = placeMoist(world, 0, 0, 1, 100, 50)
    const b = placeMoist(world, 1, 0, 99, 100, 50)

    // diff = -98, transfer = min(49, 50) = -49  →  A would go to 50 (gains), but
    // let's verify the low side: B loses 49 → 50, A gains 49 → 50
    moistureSystem(world)

    expect(getComponent(world, a, 'moisture')!.current).toBe(50)
    expect(getComponent(world, b, 'moisture')!.current).toBe(50)
  })

  it('does not transfer between non-adjacent tiles', () => {
    const world = createWorld()
    const a = placeMoist(world, 0, 0, 100)
    const b = placeMoist(world, 2, 0, 0) // gap at (1,0)

    moistureSystem(world)

    expect(getComponent(world, a, 'moisture')!.current).toBe(100)
    expect(getComponent(world, b, 'moisture')!.current).toBe(0)
  })

  it('handles a 3-tile chain with Jacobi (simultaneous) updates', () => {
    const world = createWorld()
    const a = placeMoist(world, 0, 0, 10, 100, 5)
    const b = placeMoist(world, 1, 0, 0, 100, 5)
    const c = placeMoist(world, 2, 0, 0, 100, 5)

    moistureSystem(world)

    // Face A↔B: diff=10, transfer = min(5, 5) = 5  → A:-5, B:+5
    // Face B↔C: diff=0, transfer = 0
    // Net: A=5, B=5, C=0
    expect(getComponent(world, a, 'moisture')!.current).toBe(5)
    expect(getComponent(world, b, 'moisture')!.current).toBe(5)
    expect(getComponent(world, c, 'moisture')!.current).toBe(0)

    // Second tick: A↔B diff=0, B↔C diff=5 → transfer=min(2.5, 5)=2.5
    moistureSystem(world)

    expect(getComponent(world, a, 'moisture')!.current).toBe(5)
    expect(getComponent(world, b, 'moisture')!.current).toBe(2.5)
    expect(getComponent(world, c, 'moisture')!.current).toBe(2.5)
  })

  it('works on both axes (right and down neighbors)', () => {
    const world = createWorld()
    //  A(10) — B(0)
    //  |
    //  C(0)
    const a = placeMoist(world, 0, 0, 10)
    const b = placeMoist(world, 1, 0, 0)
    const c = placeMoist(world, 0, 1, 0)

    moistureSystem(world)

    // A has two faces: A↔B (diff=10, t=1) and A↔C (diff=10, t=1) → net A: -2
    expect(getComponent(world, a, 'moisture')!.current).toBe(8)
    expect(getComponent(world, b, 'moisture')!.current).toBe(1)
    expect(getComponent(world, c, 'moisture')!.current).toBe(1)
  })

  it('is perfectly deterministic across runs', () => {
    function runSim() {
      const world = createWorld()
      placeMoist(world, 0, 0, 100, 100, 3)
      placeMoist(world, 1, 0, 0, 100, 3)
      placeMoist(world, 0, 1, 50, 80, 2)
      placeMoist(world, 1, 1, 20, 60, 4)
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
    const id = createEntity(world)
    getEntityTypeDef('dirt')!.import(world, id, {
      entityType: 'dirt',
      position: { x, y, z: 0 },
    })
    return id
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
