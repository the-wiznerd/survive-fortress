const EDGE: EdgeVariants = {
  row: 0,
  topCols: [11, 12, 13, 14, 16, 15, 17, 14],
  frontCols: [20, 19, 21, 18],
}

export class SandRenderer extends EntityRenderer {
  readonly terrain = true

  render(id: EntityId, dc: DrawContext) {
    dc.drawEdgeTerrain(EDGE)
  }

  inspect(id: EntityId, world: World): string | null {
    const moisture = getComponent(world, id, 'moisture')
    if (!moisture) return ''
    return `<div class="stat"><span class="label">moisture:</span> ${moisture.current}/${moisture.capacity} (cond: ${moisture.conductivity})</div>`
  }
}
