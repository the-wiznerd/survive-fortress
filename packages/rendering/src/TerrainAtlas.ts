
import { TILE_W, TOP_FACE_H, FRONT_FACE_H, ATLAS_ROW_H } from '~rendering/constants.js'

/**
 * A draw function that renders a terrain face onto a 16×12 pixel canvas.
 * The canvas context is pre-translated so (0,0) is the top-left of the cell.
 */
export type FaceDrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number) => void

/**
 * Definition for a programmatically generated terrain type.
 * Provide draw functions for each face and an edge color for border variants.
 */
export interface TerrainDef {
  /** Draw the base top face (flat, no edges). */
  top: FaceDrawFn
  /** Draw the base front face (flat, no edges). */
  front: FaceDrawFn
  /** Draw the "unknown above" top face variant. */
  unknownTop: FaceDrawFn
  /** Color used for 1px top face edge borders and corner cutouts. */
  topEdgeColor: string
  /** Color used for 1px front face edge borders. */
  frontEdgeColor: string
}

/** Atlas cell coordinates. */
interface Cell { col: number; row: number }

/**
 * Terrain variant info for a registered terrain type.
 * topFaces[N*4 + E*2 + W] → atlas cell for that edge combo.
 * frontFaces[E*2 + W] → atlas cell.
 * unknownTop → atlas cell.
 */
export interface TerrainVariantCells {
  topFaces: Cell[]
  frontFaces: Cell[]
  unknownTop: Cell
}

/**
 * Edge directions for top face compositing.
 * N = top edge, E = right edge, W = left edge.
 */
const TOP_EDGE_COMBOS = [
  { n: 0, e: 0, w: 0 }, // flat
  { n: 0, e: 0, w: 1 }, // W
  { n: 0, e: 1, w: 0 }, // E
  { n: 0, e: 1, w: 1 }, // EW
  { n: 1, e: 0, w: 0 }, // N
  { n: 1, e: 0, w: 1 }, // NW
  { n: 1, e: 1, w: 0 }, // NE
  { n: 1, e: 1, w: 1 }, // NEW
]

const FRONT_EDGE_COMBOS = [
  { s: 0, e: 0, w: 0 }, // flat
  { s: 0, e: 0, w: 1 }, // W
  { s: 0, e: 1, w: 0 }, // E
  { s: 0, e: 1, w: 1 }, // EW
  { s: 1, e: 0, w: 0 }, // S
  { s: 1, e: 0, w: 1 }, // SW
  { s: 1, e: 1, w: 0 }, // SE
  { s: 1, e: 1, w: 1 }, // SEW
]

/**
 * Generates a texture atlas of all terrain edge variants at runtime.
 * Each registered terrain type gets 8 top + 8 front + 1 unknownTop = 17 cells.
 * The atlas is a single ImageBitmap for GPU-resident rendering.
 */
export class TerrainAtlas {
  private defs: { name: string; def: TerrainDef }[] = []
  private variantMap = new Map<string, TerrainVariantCells>()
  private _bitmap: ImageBitmap | null = null
  private _canvas: HTMLCanvasElement | null = null

  /** Number of cell columns in the atlas. */
  private atlasCols = 17

  /** Register a terrain type for atlas generation. */
  register(name: string, def: TerrainDef) {
    this.defs.push({ name, def })
  }

  /** Get variant cells for a terrain type (available after generate()). */
  getVariants(name: string): TerrainVariantCells | undefined {
    return this.variantMap.get(name)
  }

  /** The generated atlas image. Available after generate(). */
  get bitmap(): ImageBitmap | null {
    return this._bitmap
  }

  /** Fallback canvas source (available synchronously after generate, before bitmap resolves). */
  get canvas(): HTMLCanvasElement | null {
    return this._canvas
  }

  /**
   * Generate the atlas. Call once after all terrain types are registered.
   * Returns when the ImageBitmap is ready.
   */
  async generate(): Promise<void> {
    const rows = this.defs.length
    const cols = this.atlasCols
    const w = cols * TILE_W
    const h = rows * ATLAS_ROW_H

    const atlas = document.createElement('canvas')
    atlas.width = w
    atlas.height = h
    const ctx = atlas.getContext('2d')!
    ctx.imageSmoothingEnabled = false

    // Temp canvas for compositing individual cells (base + edges + corners).
    const tmp = document.createElement('canvas')
    tmp.width = TILE_W
    tmp.height = ATLAS_ROW_H
    const tmpCtx = tmp.getContext('2d')!
    tmpCtx.imageSmoothingEnabled = false

    for (let typeIdx = 0; typeIdx < this.defs.length; typeIdx++) {
      const { name, def } = this.defs[typeIdx]
      const baseY = typeIdx * ATLAS_ROW_H
      let col = 0

      // --- 8 top face variants ---
      const topFaces: Cell[] = []
      for (const combo of TOP_EDGE_COMBOS) {
        this.compositeTop(tmpCtx, def, combo.n, combo.e, combo.w)
        ctx.drawImage(tmp, 0, 0, TILE_W, TOP_FACE_H, col * TILE_W, baseY, TILE_W, TOP_FACE_H)
        topFaces.push({ col, row: typeIdx })
        col++
      }

      // --- 8 front face variants ---
      const frontFaces: Cell[] = []
      for (const combo of FRONT_EDGE_COMBOS) {
        this.compositeFront(tmpCtx, def, combo.s, combo.e, combo.w)
        ctx.drawImage(tmp, 0, 0, TILE_W, FRONT_FACE_H, col * TILE_W, baseY, TILE_W, FRONT_FACE_H)
        frontFaces.push({ col, row: typeIdx })
        col++
      }

      // --- 1 unknown top ---
      tmpCtx.clearRect(0, 0, TILE_W, TOP_FACE_H)
      def.unknownTop(tmpCtx, TILE_W, TOP_FACE_H)
      ctx.drawImage(tmp, 0, 0, TILE_W, TOP_FACE_H, col * TILE_W, baseY, TILE_W, TOP_FACE_H)
      const unknownTop = { col, row: typeIdx }

      this.variantMap.set(name, { topFaces, frontFaces, unknownTop })
    }

    this._canvas = atlas
    this._bitmap = await createImageBitmap(atlas)
  }

  /** Composite a top face variant: base + corner cutouts + edge borders. */
  private compositeTop(
    ctx: CanvasRenderingContext2D,
    def: TerrainDef,
    n: number, e: number, w: number,
  ) {
    ctx.clearRect(0, 0, TILE_W, TOP_FACE_H)

    // 1. Draw base top face.
    ctx.globalCompositeOperation = 'source-over'
    def.top(ctx, TILE_W, TOP_FACE_H)

    // 2. Draw 1px edge borders.
    ctx.fillStyle = def.topEdgeColor
    if (n) ctx.fillRect(0, 0, TILE_W, 1)
    if (w) ctx.fillRect(0, 0, 1, TOP_FACE_H)
    if (e) ctx.fillRect(TILE_W - 1, 0, 1, TOP_FACE_H)

    // 3. Erase corner pixels where two edges meet.
    ctx.globalCompositeOperation = 'destination-out'
    if (n && w) ctx.fillRect(0, 0, 1, 1)
    if (n && e) ctx.fillRect(TILE_W - 1, 0, 1, 1)

    ctx.globalCompositeOperation = 'source-over'
  }

  /** Composite a front face variant: base + edge borders + corner cutouts. */
  private compositeFront(
    ctx: CanvasRenderingContext2D,
    def: TerrainDef,
    s: number, e: number, w: number,
  ) {
    ctx.clearRect(0, 0, TILE_W, FRONT_FACE_H)

    // 1. Draw base front face.
    ctx.globalCompositeOperation = 'source-over'
    def.front(ctx, TILE_W, FRONT_FACE_H)

    // 2. Draw 1px edge borders.
    ctx.fillStyle = def.frontEdgeColor
    if (s) ctx.fillRect(0, FRONT_FACE_H - 1, TILE_W, 1)
    if (w) ctx.fillRect(0, 0, 1, FRONT_FACE_H)
    if (e) ctx.fillRect(TILE_W - 1, 0, 1, FRONT_FACE_H)

    // 3. Erase corner pixels where two edges meet.
    ctx.globalCompositeOperation = 'destination-out'
    if (s && w) ctx.fillRect(0, FRONT_FACE_H - 1, 1, 1)
    if (s && e) ctx.fillRect(TILE_W - 1, FRONT_FACE_H - 1, 1, 1)

    ctx.globalCompositeOperation = 'source-over'
  }
}
