const EDGE: EdgeVariants = {
  row: 2,
  topCols: [0, 1, 2, 3, 5, 4, 6, 3],
  frontCols: [9, 8, 10, 7],
}

export class WaterRenderer extends EntityRenderer {
  readonly terrain = true

  render(
    ctx: CanvasRenderingContext2D, sheet: HTMLImageElement, scale: number,
    id: EntityId, sx: number, sy: number, z: number,
    wx: number, wy: number, rc: RenderContext,
  ) {
    // Water borders appear where a same-z neighbor is non-water.
    const n = this.hasNonWaterNeighbor(rc.world, wx, wy - 1, z) ? 1 : 0
    const e = this.hasNonWaterNeighbor(rc.world, wx + 1, wy, z) ? 1 : 0
    const w = this.hasNonWaterNeighbor(rc.world, wx - 1, wy, z) ? 1 : 0
    const frontOccluded = rc.terrainAt.has(posKey(wx, wy + 1, z))

    this.drawTopFace(ctx, sheet, scale, EDGE.topCols[n * 4 + e * 2 + w], EDGE.row, sx, sy, z)
    if (!frontOccluded) {
      this.drawFrontFace(ctx, sheet, scale, EDGE.frontCols[e * 2 + w], EDGE.row, sx, sy, z)
    }
  }

  /** Check if a cell has terrain at the given z that isn't water. */
  private hasNonWaterNeighbor(world: World, x: number, y: number, z: number): boolean {
    for (const [id, pos] of world.components.position) {
      if (pos.x === x && pos.y === y && pos.z === z) {
        const et = getComponent(world, id, 'entityType')
        if (et && et.type !== 'water') return true
      }
    }
    return false
  }

  inspect(id: EntityId, world: World): string | null {
    const moisture = getComponent(world, id, 'moisture')
    if (!moisture) return ''
    return `<div class="stat"><span class="label">moisture:</span> ${moisture.current}/${moisture.capacity} (cond: ${moisture.conductivity})</div>`
  }
}
