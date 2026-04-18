import { WorldRenderer, CELL_W, CELL_H, TOP_H, FRONT_H, ATLAS_ROW_H, type RenderEntity, type TerrainVariantCells } from '@repo/rendering'

/** Preview sprite info per entity type. */
type TerrainPreview = { kind: 'terrain'; atlas: true } | { kind: 'terrain'; atlas: false; topCol: number; frontCol: number; row: number }
type UprightPreview = { kind: 'upright'; col: number; row: number; h: number; yOff: number }
type PreviewSprite = TerrainPreview | UprightPreview

const PREVIEW_SPRITES: Record<string, PreviewSprite> = {
  dirt: { kind: 'terrain', atlas: true },
  sand: { kind: 'terrain', atlas: true },
  stone: { kind: 'terrain', atlas: true },
  water: { kind: 'terrain', atlas: false, topCol: 0, frontCol: 4, row: 2 },
  player: { kind: 'upright', col: 0, row: 14, h: 2, yOff: -0.25 },
}

export class EditorRenderer {
  private world: WorldRenderer
  private cameraX = 0
  private cameraY = 0

  get onReady() { return this.world.onReady }
  set onReady(cb: (() => void) | null) { this.world.onReady = cb }

  constructor(
    private canvas: HTMLCanvasElement,
    private viewWidth: number,
    private viewHeight: number,
    scale: number,
  ) {
    this.world = new WorldRenderer(canvas, viewWidth, viewHeight, scale, '/sprites/sprites.png')
  }

  setCamera(x: number, y: number) {
    this.cameraX = x
    this.cameraY = y
  }

  /** Convert canvas pixel coords to world (x, y) at the given z-level. */
  screenToWorld(canvasX: number, canvasY: number, z: number): { x: number; y: number } {
    const camX = Math.floor(this.cameraX)
    const camY = Math.floor(this.cameraY)
    const sx = canvasX / CELL_W
    const sy = canvasY / TOP_H
    return {
      x: Math.floor(camX + sx),
      y: Math.floor(camY + sy + z),
    }
  }

  render(
    entities: RenderEntity[],
    activeZ: number,
    hoveredCell: { x: number; y: number } | null,
    activeTool: 'draw' | 'delete',
    activeType: string,
  ) {
    if (!this.world.ready) return

    const self = this
    this.world.render(entities, this.cameraX, this.cameraY, new Set(), -Infinity, 0, {
      onAfterEntities(ctx) {
        // Origin marker at (0, 0, 0).
        const ox = -Math.floor(self.cameraX)
        const oy = -activeZ - Math.floor(self.cameraY)
        if (ox >= 0 && ox < self.viewWidth && oy >= 0 && oy < self.viewHeight) {
          const cx = ox * CELL_W + CELL_W / 2
          const cy = oy * TOP_H - activeZ * FRONT_H + TOP_H / 2
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(cx, cy, 2, 0, Math.PI * 2)
          ctx.fill()
        }

        // Grid overlay for current Z-level.
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.lineWidth = 1
        const gridOffY = -activeZ * FRONT_H
        for (let x = 0; x < self.viewWidth; x++) {
          for (let y = 0; y < self.viewHeight; y++) {
            ctx.strokeRect(x * CELL_W + 0.5, y * TOP_H + gridOffY + 0.5, CELL_W - 1, TOP_H - 1)
          }
        }

        // Hover preview / highlight.
        if (hoveredCell) {
          const hx = hoveredCell.x - Math.floor(self.cameraX)
          const hy = hoveredCell.y - activeZ - Math.floor(self.cameraY)
          if (hx >= 0 && hx < self.viewWidth && hy >= 0 && hy < self.viewHeight) {
            if (activeTool === 'draw') {
              const sprite = PREVIEW_SPRITES[activeType]
              if (sprite) {
                ctx.globalAlpha = 0.75
                const dx = hx * CELL_W
                const dy = hy * TOP_H - activeZ * FRONT_H
                if (sprite.kind === 'terrain') {
                  if (sprite.atlas) {
                    const atlasSource = self.world.terrainAtlas.bitmap ?? self.world.terrainAtlas.canvas
                    const variants = self.world.terrainAtlas.getVariants(activeType)
                    if (atlasSource && variants) {
                      const topCell = variants.topFaces[0] // flat variant
                      const frontCell = variants.frontFaces[0]
                      ctx.drawImage(
                        atlasSource,
                        topCell.col * CELL_W, topCell.row * ATLAS_ROW_H, CELL_W, TOP_H,
                        dx, dy, CELL_W, TOP_H,
                      )
                      ctx.drawImage(
                        atlasSource,
                        frontCell.col * CELL_W, frontCell.row * ATLAS_ROW_H, CELL_W, FRONT_H,
                        dx, dy + TOP_H, CELL_W, FRONT_H,
                      )
                    }
                  } else {
                    // Sprite-sheet based terrain (water).
                    ctx.drawImage(
                      self.world.spriteSheet,
                      sprite.topCol * CELL_W, sprite.row * CELL_H, CELL_W, CELL_H,
                      dx, dy, CELL_W, CELL_H,
                    )
                    ctx.drawImage(
                      self.world.spriteSheet,
                      sprite.frontCol * CELL_W, sprite.row * CELL_H, CELL_W, CELL_H,
                      dx, dy + TOP_H, CELL_W, CELL_H,
                    )
                  }
                } else {
                  ctx.drawImage(
                    self.world.spriteSheet,
                    sprite.col * CELL_W, sprite.row * CELL_H, CELL_W, CELL_H * sprite.h,
                    dx, dy + sprite.yOff * TOP_H, CELL_W, CELL_H * sprite.h,
                  )
                }
                ctx.globalAlpha = 1
              }
            } else {
              ctx.fillStyle = 'rgba(230, 60, 60, 0.25)'
              ctx.fillRect(hx * CELL_W, hy * TOP_H - activeZ * FRONT_H, CELL_W, TOP_H + FRONT_H)
            }
          }
        }
      },
    })
  }
}
