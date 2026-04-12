export function moistureSystem(world: World) {
  const processed = new Set<string>()

  for (const id of queryEntities(world, 'moisture', 'position')) {
    const pos = getComponent(world, id, 'position')!
    const moisture = getComponent(world, id, 'moisture')!

    for (const [nx, ny] of getNeighborCoords(pos.x, pos.y)) {
      for (const nid of getEntitiesAt(world, nx, ny, pos.z)) {
        const nMoisture = getComponent(world, nid, 'moisture')
        if (!nMoisture) continue

        const pairKey = id < nid ? `${id}:${nid}` : `${nid}:${id}`
        if (processed.has(pairKey)) continue
        processed.add(pairKey)

        const diff = moisture.current - nMoisture.current
        if (diff === 0) continue

        const rate = Math.min(moisture.rate, nMoisture.rate)
        const transfer = Math.min(Math.abs(diff) / 2, rate) * Math.sign(diff)

        const give = Math.min(transfer, moisture.current)
        const take = Math.min(give, nMoisture.capacity - nMoisture.current)

        moisture.current -= take
        nMoisture.current += take
      }
    }
  }
}
