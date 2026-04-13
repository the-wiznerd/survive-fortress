export class PlayerRenderer extends EntityRenderer {
  render(
    ctx: CanvasRenderingContext2D, sheet: HTMLImageElement, scale: number,
    id: EntityId, sx: number, sy: number, z: number,
    wx: number, wy: number, rc: RenderContext,
  ) {
    this.drawSprite(ctx, sheet, scale, 9, 6, sx, sy, z)
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
