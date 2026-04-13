// Sprite sheet: 16×12px cells. Each cell is one face (top or front).
const CELL_W = 16
const CELL_H = 12

type StaticSprite = { col: number; row: number }
type AnimatedSprite = { frames: StaticSprite[]; interval: number }

/** Simple sprites: top face at (col, row), front face at (col, row+1). */
const ENTITY_SPRITES: Record<string, StaticSprite | AnimatedSprite> = {
  player: { col: 9, row: 6 },
  water: { col: 0, row: 3 },
}

/**
 * Edge variant lookup for terrain with elevation-aware borders.
 * topCols: indexed by N*4 + E*2 + W (0–7) → source column for top face.
 * frontCols: indexed by E*2 + W (0–3) → source column for front face.
 * All face cells live in the same row.
 */
interface EdgeVariants {
  row: number
  topCols: number[]
  frontCols: number[]
}

const EDGE_VARIANTS: Record<string, EdgeVariants> = {
  dirt: {
    row: 0,
    //           none  W   E  E+W   N  N+W  N+E N+E+W
    topCols: [0, 1, 2, 3, 5, 4, 6, 3],
    //           none  W    E  E+W
    frontCols: [9, 8, 10, 7],
  },
  sand: {
    row: 0,
    topCols: [11, 12, 13, 14, 16, 15, 17, 14],
    frontCols: [20, 19, 21, 18],
  },
  grass: {
    row: 1,
    topCols: [0, 1, 2, 3, 5, 4, 6, 3],
    frontCols: [9, 8, 10, 7],
  },
  stone: {
    row: 1,
    topCols: [11, 12, 13, 14, 16, 15, 17, 14],
    frontCols: [20, 19, 21, 18],
  },
}

/** Ground cover overlay: drawn using EDGE_VARIANTS['grass'] with same edge flags as parent tile. */
const GROUND_COVER_EDGE = 'grass'

/** Entity types drawn as terrain cubes (front face overlapped by next row). */
const TERRAIN_TYPES = new Set(['dirt', 'sand', 'water', 'stone'])

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private cameraX = 0
  private cameraY = 0
  private spriteSheet: HTMLImageElement
  private spriteReady = false

  /** Scaled pixel width of one tile on screen. */
  private destW: number
  /** Scaled row-advance (= face height) in screen pixels. */
  private rowStep: number

  constructor(
    private canvas: HTMLCanvasElement,
    private viewWidth: number,
    private viewHeight: number,
    private scale: number, // pixels per source pixel
  ) {
    this.destW = CELL_W * scale
    this.rowStep = CELL_H * scale

    // Canvas: full tile width, rows overlap by the front-face height.
    canvas.width = viewWidth * this.destW
    // First row gets two faces (top + front); each subsequent row adds one rowStep.
    canvas.height = this.rowStep * 2 + (viewHeight - 1) * this.rowStep
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

  /** Draw a single face cell from the sheet at the top-face screen position. */
  private drawTopFace(col: number, row: number, screenX: number, screenY: number, z: number) {
    if (!this.spriteReady) return
    this.ctx.drawImage(
      this.spriteSheet,
      col * CELL_W, row * CELL_H, CELL_W, CELL_H,
      screenX * this.destW,
      screenY * this.rowStep - z * this.rowStep,
      this.destW, this.rowStep,
    )
  }

  /** Draw a single face cell from the sheet at the front-face screen position. */
  private drawFrontFace(col: number, row: number, screenX: number, screenY: number, z: number) {
    if (!this.spriteReady) return
    this.ctx.drawImage(
      this.spriteSheet,
      col * CELL_W, row * CELL_H, CELL_W, CELL_H,
      screenX * this.destW,
      screenY * this.rowStep - z * this.rowStep + this.rowStep,
      this.destW, this.rowStep,
    )
  }

  /** Draw a full two-cell sprite: top face at (col, row), front face at (col, row+1). */
  private drawSprite(col: number, row: number, screenX: number, screenY: number, z = 0) {
    this.drawTopFace(col, row, screenX, screenY, z)
    this.drawFrontFace(col, row + 1, screenX, screenY, z)
  }

  render(world: World) {
    const { ctx, destW, rowStep, viewWidth, viewHeight, cameraX, cameraY } = this

    // Clear.
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Collect visible entities into rows for back-to-front drawing.
    // Separate terrain (cubes whose front face is meant to overlap) from
    // upright entities (player, NPCs) that must draw on top of all terrain.
    type Entry = { id: EntityId; sx: number; sy: number; z: number; wx: number; wy: number }
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
      bucket[sy].push({ id, sx, sy, z: pos.z, wx: pos.x, wy: pos.y })
    }

    // Max terrain z at each (x, y) for edge detection.
    const maxZ = new Map<number, number>()
    const zKey = (x: number, y: number) => y * 100000 + x
    // Terrain presence at (x, y, z) for front-face occlusion.
    const terrainAt = new Set<number>()
    const posKey = (x: number, y: number, z: number) => ((z + 128) << 20) | ((y & 0x3FF) << 10) | (x & 0x3FF)

    for (const row of terrainRows) {
      for (const { wx, wy, z } of row) {
        const k = zKey(wx, wy)
        const prev = maxZ.get(k)
        if (prev === undefined || z > prev) maxZ.set(k, z)
        terrainAt.add(posKey(wx, wy, z))
      }
    }

    // Pass 1: Terrain (back-to-front). Top face and front face drawn separately;
    // front face is skipped when occluded by the next row's top face at the same z.
    for (const row of terrainRows) {
      row.sort((a, b) => a.z - b.z)
      for (const { id, sx, sy, z, wx, wy } of row) {
        const typeName = getComponent(world, id, 'entityType')!.type
        const frontOccluded = terrainAt.has(posKey(wx, wy + 1, z))

        const edge = EDGE_VARIANTS[typeName]
        if (edge) {
          const n = (maxZ.get(zKey(wx, wy - 1)) ?? -Infinity) < z ? 1 : 0
          const e = (maxZ.get(zKey(wx + 1, wy)) ?? -Infinity) < z ? 1 : 0
          const w = (maxZ.get(zKey(wx - 1, wy)) ?? -Infinity) < z ? 1 : 0
          this.drawTopFace(edge.topCols[n * 4 + e * 2 + w], edge.row, sx, sy, z)
          if (!frontOccluded) {
            this.drawFrontFace(edge.frontCols[e * 2 + w], edge.row, sx, sy, z)
          }
        } else {
          const sprite = ENTITY_SPRITES[typeName]!
          if ('frames' in sprite) {
            const offset = (wx + wy) % sprite.frames.length
            const frame = sprite.frames[(Math.floor(performance.now() / sprite.interval) + offset) % sprite.frames.length]
            this.drawTopFace(frame.col, frame.row, sx, sy, z)
            if (!frontOccluded) {
              this.drawFrontFace(frame.col, frame.row + 1, sx, sy, z)
            }
          } else {
            this.drawTopFace(sprite.col, sprite.row, sx, sy, z)
            if (!frontOccluded) {
              this.drawFrontFace(sprite.col, sprite.row + 1, sx, sy, z)
            }
          }
        }

        // Ground cover overlay (e.g. grass on dirt) — uses its own edge variants.
        const cover = getComponent(world, id, 'groundCover')
        if (cover?.cover) {
          const coverEdge = EDGE_VARIANTS[cover.cover]
          if (coverEdge) {
            const n = (maxZ.get(zKey(wx, wy - 1)) ?? -Infinity) < z ? 1 : 0
            const e = (maxZ.get(zKey(wx + 1, wy)) ?? -Infinity) < z ? 1 : 0
            const w = (maxZ.get(zKey(wx - 1, wy)) ?? -Infinity) < z ? 1 : 0
            this.drawTopFace(coverEdge.topCols[n * 4 + e * 2 + w], coverEdge.row, sx, sy, z)
            if (!frontOccluded) {
              this.drawFrontFace(coverEdge.frontCols[e * 2 + w], coverEdge.row, sx, sy, z)
            }
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
