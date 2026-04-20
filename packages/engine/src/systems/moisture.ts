import { buildFaces2d, getComponent, intDiv, type World, type EntityId } from '@repo/state'

// Maximum neighbor count on a 2D grid. Using a constant rather than the
// actual per-entity face count satisfies the CFL stability condition
// uniformly, preventing checkerboard oscillation.
const MAX_NEIGHBORS = 4

export function moistureSystem(world: World) {
  const faces = buildFaces2d(world, 'moisture')

  // Phase 1: compute per-face transfers.
  //
  //   transfer = intDiv(diff * min(condA, condB), 200 * MAX_NEIGHBORS)
  //
  // The 200 halves the gradient and converts conductivity % to a fraction.
  // Dividing by MAX_NEIGHBORS ensures total outflow across all edges stays
  // within stable bounds.
  const transfers: number[] = []
  for (const { entityA, entityB } of faces) {
    const mA = getComponent(world, entityA, 'moisture')!
    const mB = getComponent(world, entityB, 'moisture')!
    const diff = mA.current - mB.current
    if (diff === 0) { transfers.push(0); continue }

    const transfer = intDiv(diff * Math.min(mA.conductivity, mB.conductivity), 200 * MAX_NEIGHBORS)
    transfers.push(transfer)
  }

  // Phase 2: accumulate net delta per entity.
  const netDelta = new Map<EntityId, number>()
  for (let i = 0; i < faces.length; i++) {
    const t = transfers[i]
    if (t === 0) continue
    const { entityA, entityB } = faces[i]
    netDelta.set(entityA, (netDelta.get(entityA) ?? 0) - t)
    netDelta.set(entityB, (netDelta.get(entityB) ?? 0) + t)
  }

  // Phase 3: nudge stalled entities. If an entity got zero net delta from
  // the main transfers but has a neighbor with different moisture, nudge it
  // by ±1. At most one nudge per entity, so this can't cause oscillation.
  for (const { entityA, entityB } of faces) {
    const mA = getComponent(world, entityA, 'moisture')!
    const mB = getComponent(world, entityB, 'moisture')!
    if (mA.current === mB.current) continue

    if (!netDelta.has(entityA) && mA.current > mB.current) {
      netDelta.set(entityA, -1)
    } else if (!netDelta.has(entityB) && mB.current > mA.current) {
      netDelta.set(entityB, -1)
    }
  }

  // Phase 4: commit clamped deltas.
  for (const [id, delta] of netDelta) {
    const m = getComponent(world, id, 'moisture')!
    m.current = Math.max(0, Math.min(m.capacity, m.current + delta))
  }
}
