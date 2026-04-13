const EDGE: EdgeVariants = {
  row: 1,
  topCols: [11, 12, 13, 14, 16, 15, 17, 14],
  frontCols: [20, 19, 21, 18],
}

export class StoneRenderer extends EntityRenderer {
  readonly terrain = true

  render(
    ctx: CanvasRenderingContext2D, sheet: HTMLImageElement, scale: number,
    id: EntityId, sx: number, sy: number, z: number,
    wx: number, wy: number, rc: RenderContext,
  ) {
    this.drawEdgeTerrain(ctx, sheet, scale, EDGE, sx, sy, z, wx, wy, rc)
  }
}
