const EDGE_ROWS = [2, 3, 4, 5] // 4 animation frames, same col layout per row
const EDGE_TOP_COLS = [0, 1, 2, 3, 5, 4, 6, 3]
const EDGE_FRONT_COLS = [9, 8, 10, 7]

/** Water sits 3 source pixels lower than surrounding terrain. */
const Y_OFFSET = 3
const ANIM_INTERVAL = 250 // ms per frame

export class WaterRenderer extends EntityRenderer {
  readonly terrain = true
  readonly occluding = false

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
    const yOff = Y_OFFSET * scale

    // Animation: stagger by world position so tiles don't all sync.
    const frame = (Math.floor(rc.now / ANIM_INTERVAL) + wx + wy) % EDGE_ROWS.length
    const row = EDGE_ROWS[frame]

    const destW = CELL_W * scale
    const rowStep = CELL_H * scale
    const topCol = EDGE_TOP_COLS[n * 4 + e * 2 + w]
    const destX = sx * destW
    const destY = sy * rowStep - z * rowStep + yOff

    ctx.drawImage(sheet,
      topCol * CELL_W, row * CELL_H, CELL_W, CELL_H,
      destX, destY, destW, rowStep)

    if (!frontOccluded) {
      const frontCol = EDGE_FRONT_COLS[e * 2 + w]
      ctx.drawImage(sheet,
        frontCol * CELL_W, row * CELL_H, CELL_W, CELL_H,
        destX, destY + rowStep, destW, rowStep)
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
