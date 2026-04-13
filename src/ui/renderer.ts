// Sprite sheet: each tile is 16px wide × 24px tall.
// The top 12px is the top face; the bottom 12px is the front face.
const SPRITE_W = 16
const SPRITE_H = 24
const FACE_H = 12 // height of each "face" (top / front) in source pixels

type StaticSprite = { col: number; row: number }
type AnimatedSprite = { frames: StaticSprite[]; interval: number }

/** Maps entity type → sprite location (or animation) in the sheet. */
const ENTITY_SPRITES: Record<string, StaticSprite | AnimatedSprite> = {
  dirt: { col: 0, row: 1 },
  sand: { col: 2, row: 1 },
  player: { col: 9, row: 1 },
  water: {
    frames: [
      { col: 4, row: 1 },
      { col: 5, row: 1 },
      { col: 6, row: 1 },
      { col: 7, row: 1 },
    ],
    interval: 250,
  },
}

/** Maps ground cover name → sprite location in the sheet. */
const GROUND_COVER_SPRITES: Record<string, StaticSprite> = {
  grass: { col: 1, row: 1 },
}

/** Entity types drawn as terrain cubes (front face overlapped by next row). */
const TERRAIN_TYPES = new Set(['dirt', 'sand', 'water'])

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private cameraX = 0
  private cameraY = 0
  private spriteSheet: HTMLImageElement
  private spriteReady = false

  /** Scaled pixel width of one tile on screen. */
  private destW: number
  /** Scaled pixel height of one tile on screen. */
  private destH: number
  /** Scaled row-advance (top-face height) in screen pixels. */
  private rowStep: number

  constructor(
    private canvas: HTMLCanvasElement,
    private viewWidth: number,
    private viewHeight: number,
    private scale: number, // pixels per source pixel
  ) {
    this.destW = SPRITE_W * scale
    this.destH = SPRITE_H * scale
    this.rowStep = FACE_H * scale

    // Canvas: full tile width, but rows overlap by the front-face height.
    canvas.width = viewWidth * this.destW
    // First row gets full tile height; each subsequent row adds only rowStep.
    canvas.height = this.destH + (viewHeight - 1) * this.rowStep
    this.ctx = canvas.getContext('2d')!

    // Crisp pixel scaling.
    this.ctx.imageSmoothingEnabled = false

    // Load sprite sheet.
    this.spriteSheet = new Image()
    this.spriteSheet.src = '/sprites/sprites.png'
    this.spriteSheet.onload = () => {
      this.spriteReady = true
      this.onReady?.()
    }
  }

  /** Callback invoked when the sprite sheet finishes loading. */
  onReady: (() => void) | null = null

  /** World-space coordinates for hover and selection highlights. */
  hoveredCell: { x: number; y: number } | null = null
  selectedCell: { x: number; y: number } | null = null

  setCamera(x: number, y: number) {
    this.cameraX = x - Math.floor(this.viewWidth / 2)
    this.cameraY = y - Math.floor(this.viewHeight / 2)
  }

  /** Convert canvas pixel coordinates to world (x, y). */
  screenToWorld(canvasX: number, canvasY: number): { x: number; y: number } | null {
    const sx = Math.floor(canvasX / this.destW)
    const sy = Math.floor(canvasY / this.rowStep)
    if (sx < 0 || sx >= this.viewWidth || sy < 0 || sy >= this.viewHeight) return null
    return { x: sx + this.cameraX, y: sy + this.cameraY }
  }

  /** Draw a sprite from the sheet at a screen-tile position, offset upward by z. */
  private drawSprite(col: number, row: number, screenX: number, screenY: number, z = 0) {
    if (!this.spriteReady) return
    this.ctx.drawImage(
      this.spriteSheet,
      col * SPRITE_W, row * SPRITE_H,  // source x, y
      SPRITE_W, SPRITE_H,               // source w, h
      screenX * this.destW,              // dest x
      screenY * this.rowStep - z * this.rowStep, // dest y (rows overlap, shifted up by z)
      this.destW, this.destH,            // dest w, h
    )
  }

  render(world: World) {
    const { ctx, destW, rowStep, viewWidth, viewHeight, cameraX, cameraY } = this

    // Clear.
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Collect visible entities into rows for back-to-front drawing.
    // Separate terrain (cubes whose front face is meant to overlap) from
    // upright entities (player, NPCs) that must draw on top of all terrain.
    type Entry = { id: EntityId; sx: number; sy: number; z: number }
    const terrainRows: Entry[][] = []
    const uprightRows: Entry[][] = []
    for (let i = 0; i < viewHeight; i++) { terrainRows.push([]); uprightRows.push([]) }

    for (const id of queryEntities(world, 'position', 'entityType')) {
      const pos = getComponent(world, id, 'position')!
      const sx = pos.x - cameraX
      const sy = pos.y - cameraY
      if (sx < 0 || sx >= viewWidth || sy < 0 || sy >= viewHeight) continue
      const typeName = getComponent(world, id, 'entityType')!.type
      const bucket = TERRAIN_TYPES.has(typeName) ? terrainRows : uprightRows
      bucket[sy].push({ id, sx, sy, z: pos.z })
    }

    // Pass 1: Terrain (back-to-front). Front faces overlap naturally.
    for (const row of terrainRows) {
      row.sort((a, b) => a.z - b.z)
      for (const { id, sx, sy, z } of row) {
        const typeName = getComponent(world, id, 'entityType')!.type
        const sprite = ENTITY_SPRITES[typeName]!
        if ('frames' in sprite) {
          const offset = (sx + cameraX + sy + cameraY) % sprite.frames.length
          const frame = sprite.frames[(Math.floor(performance.now() / sprite.interval) + offset) % sprite.frames.length]
          this.drawSprite(frame.col, frame.row, sx, sy, z)
        } else {
          this.drawSprite(sprite.col, sprite.row, sx, sy, z)
        }

        // Ground cover overlay (e.g. grass on dirt).
        const cover = getComponent(world, id, 'groundCover')
        if (cover?.cover) {
          const coverSprite = GROUND_COVER_SPRITES[cover.cover]
          if (coverSprite) {
            this.drawSprite(coverSprite.col, coverSprite.row, sx, sy, z)
          }
        }
      }
    }

    // Pass 2: Upright entities (back-to-front), drawn over all terrain.
    for (const row of uprightRows) {
      row.sort((a, b) => a.z - b.z)
      for (const { id, sx, sy, z } of row) {
        const typeName = getComponent(world, id, 'entityType')!.type
        const sprite = ENTITY_SPRITES[typeName]
        if (sprite) {
          if ('frames' in sprite) {
            const offset = (sx + cameraX + sy + cameraY) % sprite.frames.length
            const frame = sprite.frames[(Math.floor(performance.now() / sprite.interval) + offset) % sprite.frames.length]
            this.drawSprite(frame.col, frame.row, sx, sy, z)
          } else {
            this.drawSprite(sprite.col, sprite.row, sx, sy, z)
          }
        }
      }
    }

    // Draw tile highlights after all sprites so they overlay.
    this.drawTileHighlight(ctx, this.hoveredCell, 'rgba(255, 255, 255, 0.35)')
    this.drawTileHighlight(ctx, this.selectedCell, 'rgba(135, 206, 235, 0.6)')
  }

  private drawTileHighlight(
    ctx: CanvasRenderingContext2D,
    cell: { x: number; y: number } | null,
    color: string,
  ) {
    if (!cell) return
    const sx = cell.x - this.cameraX
    const sy = cell.y - this.cameraY
    if (sx < 0 || sx >= this.viewWidth || sy < 0 || sy >= this.viewHeight) return

    const px = sx * this.destW
    const py = sy * this.rowStep

    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.strokeRect(px + 1, py + 1, this.destW - 2, this.rowStep - 2)
  }
}
