export function moistureSystem(world: World) {
  const faces = buildFaces2d(world, 'moisture')

  // Phase 1: compute per-face transfers from unmodified state
  const transfers: number[] = []
  for (const { entityA, entityB } of faces) {
    const mA = getComponent(world, entityA, 'moisture')!
    const mB = getComponent(world, entityB, 'moisture')!
    const diff = mA.current - mB.current
    if (diff === 0) { transfers.push(0); continue }

    const rate = Math.min(mA.rate, mB.rate)
    const transfer = Math.min(Math.abs(diff) / 2, rate) * Math.sign(diff)
    transfers.push(transfer)
  }

  // Phase 2: accumulate net delta per entity
  const netDelta = new Map<EntityId, number>()
  for (let i = 0; i < faces.length; i++) {
    const t = transfers[i]
    if (t === 0) continue
    const { entityA, entityB } = faces[i]
    netDelta.set(entityA, (netDelta.get(entityA) ?? 0) - t)
    netDelta.set(entityB, (netDelta.get(entityB) ?? 0) + t)
  }

  // Phase 3: commit clamped deltas
  for (const [id, delta] of netDelta) {
    const m = getComponent(world, id, 'moisture')!
    m.current = Math.max(0, Math.min(m.capacity, m.current + delta))
  }
}
