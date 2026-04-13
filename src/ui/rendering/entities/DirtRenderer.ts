const EDGE: EdgeVariants = {
  row: 0,
  //           none  W   E  E+W   N  N+W  N+E N+E+W
  topCols: [0, 1, 2, 3, 5, 4, 6, 3],
  //           none  W    E  E+W
  frontCols: [9, 8, 10, 7],
}

const GRASS_EDGE: EdgeVariants = {
  row: 1,
  topCols: [0, 1, 2, 3, 5, 4, 6, 3],
  frontCols: [9, 8, 10, 7],
}

export class DirtRenderer extends EntityRenderer {
  readonly terrain = true

  render(
    ctx: CanvasRenderingContext2D, sheet: HTMLImageElement, scale: number,
    id: EntityId, sx: number, sy: number, z: number,
    wx: number, wy: number, rc: RenderContext,
  ) {
    this.drawEdgeTerrain(ctx, sheet, scale, EDGE, sx, sy, z, wx, wy, rc)

    // Ground cover overlay (e.g. grass).
    const cover = getComponent(rc.world, id, 'groundCover')
    if (cover?.cover === 'grass') {
      this.drawEdgeTerrain(ctx, sheet, scale, GRASS_EDGE, sx, sy, z, wx, wy, rc)
    }
  }

  inspect(id: EntityId, world: World): string | null {
    const moisture = getComponent(world, id, 'moisture')
    const cover = getComponent(world, id, 'groundCover')
    let html = ''
    if (moisture) {
      html += `<div class="stat"><span class="label">moisture:</span> ${moisture.current}/${moisture.capacity} (cond: ${moisture.conductivity})</div>`
    }
    if (cover?.cover) {
      html += `<div class="stat"><span class="label">cover:</span> ${cover.cover}</div>`
    }
    return html
  }
}
