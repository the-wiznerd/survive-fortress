import type { GameView } from '@repo/server/sdk'
import { WorldRenderer, CELL_W, CELL_H, TOP_H, FRONT_H, zKey, type RenderEntity, type EntityRenderer } from '@repo/rendering'
import { useGameStore } from '~client/stores/game'

export class Renderer {
  private world: WorldRenderer
  private cameraX = 0
  private cameraY = 0

  constructor(
    canvas: HTMLCanvasElement,
    private viewWidth: number,
    private viewHeight: number,
    scale: number,
  ) {
    this.world = new WorldRenderer(canvas, viewWidth, viewHeight, scale, '/sprites/sprites.png')
  }

  /** Callback invoked when the sprite sheet finishes loading. */
  get onReady() { return this.world.onReady }
  set onReady(cb: (() => void) | null) { this.world.onReady = cb }

  setScale(newScale: number) {
    this.world.setScale(newScale)
  }

  setCamera(x: number, y: number, z = 0) {
    this.cameraX = x - Math.floor(this.viewWidth / 2)
    this.cameraY = y - Math.floor(this.viewHeight / 2) - z * FRONT_H / TOP_H
  }

  /** Convert canvas pixel coordinates to the hovered world tile.
   * When a view is provided, iterates candidate z-levels (highest first)
   * and returns the first column that has a terrain tile there.
   * Falls back to flat z=0 projection when no view is given.
   */
  screenToWorld(canvasX: number, canvasY: number, view?: GameView): { x: number; y: number } | null {
    const wx = Math.floor(canvasX / CELL_W) + Math.floor(this.cameraX)
    if (wx - Math.floor(this.cameraX) < 0 || wx - Math.floor(this.cameraX) >= this.viewWidth) return null

    if (!view) {
      const sy = Math.floor(canvasY / TOP_H)
      if (sy < 0 || sy >= this.viewHeight) return null
      return { x: wx, y: sy + Math.floor(this.cameraY) }
    }

    const player = view.entities.find(e => String(e.id) === view.playerId)
    const vision = player?.traits.vision as { horizontalRange: number; verticalRange: number } | undefined
    const playerZ = player?.z ?? 0
    const vRange = vision?.verticalRange ?? 0

    // Build a set of terrain positions for fast lookup.
    const terrainAt = new Set<string>()
    for (const e of view.entities) {
      if (this.world.getEntityRenderer(e.type)?.terrain) {
        terrainAt.add(`${e.x},${e.y},${e.z}`)
      }
    }

    const zMax = playerZ + vRange
    const zMin = playerZ - vRange

    for (let z = zMax; z >= zMin; z--) {
      const wy = Math.floor((canvasY + z * FRONT_H) / TOP_H) + Math.floor(this.cameraY)
      if (terrainAt.has(`${wx},${wy},${z}`)) {
        return { x: wx, y: wy }
      }
    }

    // No terrain found — return the flat z=0 projection.
    const wy = Math.floor(canvasY / TOP_H) + Math.floor(this.cameraY)
    return { x: wx, y: wy }
  }

  showMoistureOverlay = false

  render(view: GameView, hoveredCell?: { x: number; y: number } | null, selectedCell?: { x: number; y: number } | null) {
    if (!this.world.ready) return

    const entities: RenderEntity[] = view.entities
      .filter(e => !e.traits.contained)
      .map(e => ({
        type: e.type,
        x: e.x,
        y: e.y,
        z: e.z,
        traits: e.traits as Record<string, unknown>,
      }))

    const self = this

    // Compute known columns from the player's position + vision range.
    const knownColumns = new Set<number>()
    const player = view.entities.find(e => String(e.id) === view.playerId)
    const vision = player?.traits.vision as { horizontalRange: number; verticalRange: number } | undefined
    if (player && vision) {
      const r2 = vision.horizontalRange * vision.horizontalRange
      for (let dx = -vision.horizontalRange; dx <= vision.horizontalRange; dx++) {
        for (let dy = -vision.horizontalRange; dy <= vision.horizontalRange; dy++) {
          if (dx * dx + dy * dy <= r2) {
            knownColumns.add(zKey(player.x + dx, player.y + dy))
          }
        }
      }
    }

    this.world.render(entities, this.cameraX, this.cameraY, knownColumns, player?.z ?? -Infinity, vision?.verticalRange ?? 0, {
      onAfterTerrain(ctx) {
        self.drawCellSprite(ctx, hoveredCell ?? null, HOVER_SPRITE_COL, view)
        self.drawCellSprite(ctx, selectedCell ?? null, SELECTED_SPRITE_COL, view)
        self.drawMoveArrows(ctx, view)
      },
      onAfterEntities(ctx) {
        if (self.showMoistureOverlay) self.drawMoistureOverlay(ctx, entities)
      },
    })
  }

  /** Get the EntityRenderer for a given type name (used by inspector). */
  getEntityRenderer(typeName: string): EntityRenderer | undefined {
    return this.world.getEntityRenderer(typeName)
  }

  private drawCellSprite(
    ctx: CanvasRenderingContext2D,
    cell: { x: number; y: number } | null,
    spriteCol: number,
    view: GameView,
  ) {
    if (!cell) return
    const sx = cell.x - this.cameraX
    const sy = cell.y - this.cameraY
    if (sx < 0 || sx >= this.viewWidth || sy < 0 || sy >= this.viewHeight) return

    const z = view.entities
      .filter(e => e.x === cell.x && e.y === cell.y && this.world.getEntityRenderer(e.type)?.terrain)
      .reduce((max, e) => Math.max(max, e.z), 0)

    ctx.drawImage(this.world.spriteSheet,
      spriteCol * CELL_W, ARROW_ROW * CELL_H, CELL_W, TOP_H,
      sx * CELL_W, sy * TOP_H - z * FRONT_H + 2,
      CELL_W, TOP_H)
  }

  private drawMoistureOverlay(ctx: CanvasRenderingContext2D, entities: RenderEntity[]) {
    ctx.font = '8px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fff'

    for (const e of entities) {
      const m = e.traits.moisture as { current: number; capacity: number } | undefined
      if (!m) continue
      const sx = e.x - this.cameraX
      const sy = e.y - this.cameraY
      if (sx < 0 || sx >= this.viewWidth || sy < 0 || sy >= this.viewHeight) continue

      const px = Math.round(sx * CELL_W + CELL_W / 2)
      const py = Math.round(sy * TOP_H + TOP_H / 2)

      ctx.fillText(String(m.current), px, py)
    }
  }

  private drawMoveArrows(ctx: CanvasRenderingContext2D, view: GameView) {
    const plan = useGameStore().plan
    if (plan.length === 0) return

    const player = view.entities.find(e => String(e.id) === view.playerId)
    if (!player) return

    let x = player.x
    let y = player.y

    const spriteSheet = this.world.spriteSheet

    for (const action of plan) {
      if (action.type === 'move') {
        x += action.dx
        y += action.dy

        const sx = x - this.cameraX
        const sy = y - this.cameraY
        if (sx < 0 || sx >= this.viewWidth || sy < 0 || sy >= this.viewHeight) continue

        const col = arrowCol(action.dx, action.dy)
        ctx.drawImage(spriteSheet,
          col * CELL_W, ARROW_ROW * CELL_H, CELL_W, TOP_H,
          sx * CELL_W, (sy + 1) * TOP_H - player.z * FRONT_H,
          CELL_W, TOP_H)
      } else if (action.type === 'harvest') {
        // Find the target entity to determine direction from cursor.
        const target = view.entities.find(e => e.id === action.targetId)
        if (!target) continue

        const sx = target.x - this.cameraX
        const sy = target.y - this.cameraY
        if (sx < 0 || sx >= this.viewWidth || sy < 0 || sy >= this.viewHeight) continue

        ctx.drawImage(spriteSheet,
          ACTION_SPRITE_COL * CELL_W, ARROW_ROW * CELL_H, CELL_W, TOP_H,
          sx * CELL_W, (sy + 1) * TOP_H - player.z * FRONT_H,
          CELL_W, TOP_H)
      }
    }

  }

}

const ARROW_ROW = 14
const HOVER_SPRITE_COL = 0
const SELECTED_SPRITE_COL = 1
const ACTION_SPRITE_COL = 6

function arrowCol(dx: number, dy: number): number {
  if (dy < 0) return 2 // up
  if (dx > 0) return 3 // right
  if (dy > 0) return 4 // down
  return 5             // left
}
