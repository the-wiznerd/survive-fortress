/**
 * Base class for per-entity-type renderers.
 * Provides reusable drawing utilities (face drawing, edge detection).
 * Subclasses override render() and inspect().
 */
export abstract class EntityRenderer {
  /** Whether this entity is terrain (front face occluded by next row). */
  readonly terrain: boolean = false

  /** Whether this terrain occludes the front face of the row above it. */
  readonly occluding: boolean = true

  /** Render this entity at the given screen position. */
  abstract render(
    ctx: CanvasRenderingContext2D,
    sheet: HTMLImageElement,
    scale: number,
    id: EntityId,
    sx: number, sy: number, z: number,
    wx: number, wy: number,
    rc: RenderContext,
  ): void

  /** Return HTML for the inspector panel, or null for default trait dump. */
  inspect(id: EntityId, world: World): string | null {
    return null
  }

  // ─── Drawing Utilities ───

  protected drawTopFace(
    ctx: CanvasRenderingContext2D, sheet: HTMLImageElement, scale: number,
    col: number, row: number, sx: number, sy: number, z: number,
  ) {
    const destW = CELL_W * scale
    const rowStep = CELL_H * scale
    ctx.drawImage(sheet,
      col * CELL_W, row * CELL_H, CELL_W, CELL_H,
      sx * destW, sy * rowStep - z * rowStep,
      destW, rowStep)
  }

  protected drawFrontFace(
    ctx: CanvasRenderingContext2D, sheet: HTMLImageElement, scale: number,
    col: number, row: number, sx: number, sy: number, z: number,
  ) {
    const destW = CELL_W * scale
    const rowStep = CELL_H * scale
    ctx.drawImage(sheet,
      col * CELL_W, row * CELL_H, CELL_W, CELL_H,
      sx * destW, sy * rowStep - z * rowStep + rowStep,
      destW, rowStep)
  }

  /** Draw top + front as a single two-cell sprite (top at row, front at row+1). */
  protected drawSprite(
    ctx: CanvasRenderingContext2D, sheet: HTMLImageElement, scale: number,
    col: number, row: number, sx: number, sy: number, z: number,
  ) {
    this.drawTopFace(ctx, sheet, scale, col, row, sx, sy, z)
    this.drawFrontFace(ctx, sheet, scale, col, row + 1, sx, sy, z)
  }

  // ─── Edge Detection Utilities ───

  /** Compute edge flags (N, E, W as 0|1) from the maxZ map. */
  protected edgeFlags(wx: number, wy: number, z: number, maxZ: Map<number, number>) {
    const n = (maxZ.get(zKey(wx, wy - 1)) ?? -Infinity) < z ? 1 : 0
    const e = (maxZ.get(zKey(wx + 1, wy)) ?? -Infinity) < z ? 1 : 0
    const w = (maxZ.get(zKey(wx - 1, wy)) ?? -Infinity) < z ? 1 : 0
    return { n, e, w }
  }

  /** Draw a terrain tile using edge variant lookup tables. */
  protected drawEdgeTerrain(
    ctx: CanvasRenderingContext2D, sheet: HTMLImageElement, scale: number,
    edge: EdgeVariants,
    sx: number, sy: number, z: number,
    wx: number, wy: number,
    rc: RenderContext,
  ) {
    const { n, e, w } = this.edgeFlags(wx, wy, z, rc.maxZ)
    const frontOccluded = rc.terrainAt.has(posKey(wx, wy + 1, z))
    this.drawTopFace(ctx, sheet, scale, edge.topCols[n * 4 + e * 2 + w], edge.row, sx, sy, z)
    if (!frontOccluded) {
      this.drawFrontFace(ctx, sheet, scale, edge.frontCols[e * 2 + w], edge.row, sx, sy, z)
    }
  }
}
