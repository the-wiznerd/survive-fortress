export class WaterRenderer extends EntityRenderer {
  readonly terrain = true

  render(
    ctx: CanvasRenderingContext2D, sheet: HTMLImageElement, scale: number,
    id: EntityId, sx: number, sy: number, z: number,
    wx: number, wy: number, rc: RenderContext,
  ) {
    const frontOccluded = rc.terrainAt.has(posKey(wx, wy + 1, z))
    this.drawTopFace(ctx, sheet, scale, 0, 3, sx, sy, z)
    if (!frontOccluded) {
      this.drawFrontFace(ctx, sheet, scale, 0, 4, sx, sy, z)
    }
  }

  inspect(id: EntityId, world: World): string | null {
    const moisture = getComponent(world, id, 'moisture')
    if (!moisture) return ''
    return `<div class="stat"><span class="label">moisture:</span> ${moisture.current}/${moisture.capacity} (cond: ${moisture.conductivity})</div>`
  }
}
