export class PlayerRenderer extends EntityRenderer {
  render(
    ctx: CanvasRenderingContext2D, sheet: HTMLImageElement, scale: number,
    id: EntityId, sx: number, sy: number, z: number,
    wx: number, wy: number, rc: RenderContext,
  ) {
    const destW = CELL_W * scale
    const rowStep = CELL_H * scale
    const destX = sx * destW
    const destY = sy * rowStep - z * rowStep - rowStep / 2

    // Upper face (row 6)
    ctx.drawImage(sheet,
      0, 6 * CELL_H, CELL_W, CELL_H,
      destX, destY, destW, rowStep)
    // Lower face (row 7)
    ctx.drawImage(sheet,
      0, 7 * CELL_H, CELL_W, CELL_H,
      destX, destY + rowStep, destW, rowStep)
  }

  inspect(id: EntityId, world: World): string | null {
    const health = getComponent(world, id, 'health')
    const hunger = getComponent(world, id, 'hunger')
    const speed = getComponent(world, id, 'speed')
    let html = ''
    if (health) html += `<div class="stat"><span class="label">health:</span> ${health.current}/${health.max}</div>`
    if (hunger) html += `<div class="stat"><span class="label">hunger:</span> ${hunger.current}/${hunger.max}</div>`
    if (speed) html += `<div class="stat"><span class="label">speed:</span> ap ${speed.ap}</div>`
    return html
  }
}
