export function moistureSystem(world: World) {
  const faces = buildFaces2d(world, 'moisture')

  // Phase 1: compute per-face transfers from unmodified state.
  //
  // Each tile's `rate` is its conductivity as an integer percentage (0–100).
  // For each pair of adjacent tiles:
  //   1. Take the difference in their moisture levels.
  //   2. Multiply by whichever tile has the lower rate (the bottleneck).
  //   3. Divide by 200 (integer, truncated toward zero).
  //
  // The 200 combines halving the gradient (so two equal tiles meet in the
  // middle) with the ÷100 to convert the percentage to a fraction.
  // All arithmetic is integer, so results are fully deterministic.
  const transfers: number[] = []
  for (const { entityA, entityB } of faces) {
    const mA = getComponent(world, entityA, 'moisture')!
    const mB = getComponent(world, entityB, 'moisture')!
    const diff = mA.current - mB.current
    if (diff === 0) { transfers.push(0); continue }

    const transfer = intDiv(diff * Math.min(mA.rate, mB.rate), 200)
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
