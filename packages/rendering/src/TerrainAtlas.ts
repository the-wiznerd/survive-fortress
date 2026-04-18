
/**
 * A draw function that renders a terrain face onto a 16×12 pixel canvas.
 * The canvas context is pre-translated so (0,0) is the top-left of the cell.
 */
export type FaceDrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number) => void

/**
 * Definition for a programmatically generated terrain type.
 * Provide draw functions for each face and a border color for edge variants.
 */
export interface TerrainDef {
  /** Draw the base top face (flat, no edges). */
  top: FaceDrawFn
  /** Draw the base front face (flat, no edges). */
  front: FaceDrawFn
  /** Draw the "unknown above" top face variant. */
  unknownTop: FaceDrawFn
  /**
   * Draw the edge border for a top face. Called once per edge direction.
   * The context is set up so you draw the border along the relevant edge.
   */
  topEdge: FaceDrawFn
  /**
   * Draw the top-face corner cutout for a rounded NE or NW corner.
   * This erases pixels from the base to create rounded edges.
   * The ctx has `destination-out` compositing set — just fill the pixels to erase.
   */
  topCorner: FaceDrawFn
  /** Draw the edge border for a front face. */
  frontEdge: FaceDrawFn
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
  { e: 0, w: 0 }, // flat
  { e: 0, w: 1 }, // W
  { e: 1, w: 0 }, // E
  { e: 1, w: 1 }, // EW
]

/**
 * Generates a texture atlas of all terrain edge variants at runtime.
 * Each registered terrain type gets 8 top + 4 front + 1 unknownTop = 13 cells.
 * The atlas is a single ImageBitmap for GPU-resident rendering.
 */
export class TerrainAtlas {
  private defs: { name: string; def: TerrainDef }[] = []
  private variantMap = new Map<string, TerrainVariantCells>()
  private _bitmap: ImageBitmap | null = null
  private _canvas: HTMLCanvasElement | null = null

  /** Number of cell columns in the atlas. */
  private atlasCols = 13

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
    const w = cols * CELL_W
    const h = rows * CELL_H

    const atlas = document.createElement('canvas')
    atlas.width = w
    atlas.height = h
    const ctx = atlas.getContext('2d')!
    ctx.imageSmoothingEnabled = false

    // Temp canvas for compositing individual cells (base + edges + corners).
    const tmp = document.createElement('canvas')
    tmp.width = CELL_W
    tmp.height = CELL_H
    const tmpCtx = tmp.getContext('2d')!
    tmpCtx.imageSmoothingEnabled = false

    for (let typeIdx = 0; typeIdx < this.defs.length; typeIdx++) {
      const { name, def } = this.defs[typeIdx]
      const baseY = typeIdx * CELL_H
      let col = 0

      // --- 8 top face variants ---
      const topFaces: Cell[] = []
      for (const combo of TOP_EDGE_COMBOS) {
        this.compositeTop(tmpCtx, def, combo.n, combo.e, combo.w)
        ctx.drawImage(tmp, col * CELL_W, baseY)
        topFaces.push({ col, row: typeIdx })
        col++
      }

      // --- 4 front face variants ---
      const frontFaces: Cell[] = []
      for (const combo of FRONT_EDGE_COMBOS) {
        this.compositeFront(tmpCtx, def, combo.e, combo.w)
        ctx.drawImage(tmp, col * CELL_W, baseY)
        frontFaces.push({ col, row: typeIdx })
        col++
      }

      // --- 1 unknown top ---
      tmpCtx.clearRect(0, 0, CELL_W, CELL_H)
      def.unknownTop(tmpCtx, CELL_W, CELL_H)
      ctx.drawImage(tmp, col * CELL_W, baseY)
      const unknownTop = { col, row: typeIdx }
      col++

      this.variantMap.set(name, { topFaces, frontFaces, unknownTop })
    }

    this._canvas = atlas
    this._bitmap = await createImageBitmap(atlas)
  }

  /** Composite a top face variant: base + edges + corner cutouts. */
  private compositeTop(
    ctx: CanvasRenderingContext2D,
    def: TerrainDef,
    n: number, e: number, w: number,
  ) {
    ctx.clearRect(0, 0, CELL_W, CELL_H)

    // 1. Draw base top face.
    ctx.globalCompositeOperation = 'source-over'
    def.top(ctx, CELL_W, CELL_H)

    // 2. Erase corner pixels where two edges meet.
    if (n && e) {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.save()
      ctx.translate(CELL_W, 0) // NE corner
      ctx.scale(-1, 1)
      def.topCorner(ctx, CELL_W, CELL_H)
      ctx.restore()
    }
    if (n && w) {
      ctx.globalCompositeOperation = 'destination-out'
      def.topCorner(ctx, CELL_W, CELL_H) // NW corner (default orientation)
    }

    // 3. Draw edge borders.
    ctx.globalCompositeOperation = 'source-over'
    if (n) {
      ctx.save()
      def.topEdge(ctx, CELL_W, CELL_H) // N edge (default orientation = top)
      ctx.restore()
    }
    if (e) {
      ctx.save()
      ctx.translate(CELL_W, 0)
      ctx.scale(-1, 1)
      def.topEdge(ctx, CELL_W, CELL_H) // E edge (mirrored W)
      ctx.restore()
    }
    if (w) {
      ctx.save()
      def.topEdge(ctx, CELL_W, CELL_H) // W edge (same as default? or separate?)
      ctx.restore()
    }

    ctx.globalCompositeOperation = 'source-over'
  }

  /** Composite a front face variant: base + edges. */
  private compositeFront(
    ctx: CanvasRenderingContext2D,
    def: TerrainDef,
    e: number, w: number,
  ) {
    ctx.clearRect(0, 0, CELL_W, CELL_H)

    // 1. Draw base front face.
    ctx.globalCompositeOperation = 'source-over'
    def.front(ctx, CELL_W, CELL_H)

    // 2. Draw edge borders.
    if (e) {
      ctx.save()
      ctx.translate(CELL_W, 0)
      ctx.scale(-1, 1)
      def.frontEdge(ctx, CELL_W, CELL_H) // E = mirrored W
      ctx.restore()
    }
    if (w) {
      ctx.save()
      def.frontEdge(ctx, CELL_W, CELL_H)
      ctx.restore()
    }

    ctx.globalCompositeOperation = 'source-over'
  }
}
