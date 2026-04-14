const SPRITE_COL = 0
const SPRITE_ROW = 6
const SPRITE_HEIGHT = 2
const Y_OFFSET = -0.25

export class PlayerRenderer extends EntityRenderer {
  render(id: EntityId, dc: DrawContext) {
    dc.draw(SPRITE_COL, SPRITE_ROW, 1, SPRITE_HEIGHT, Y_OFFSET)
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
