/** Map entity type name → sprite info for the editor. */
import { CELL_W, CELL_H, terrainVariants, type TerrainVariants } from './types'

const DIRT = terrainVariants(0, 0)
const GRASS = terrainVariants(1, 0)
const SAND = terrainVariants(0, 11)
const STONE = terrainVariants(1, 11)
const WATER = terrainVariants(0, 0)

export interface EditorSprite {
  /** Draw a tile for this entity type at the given screen position. */
  draw(ctx: CanvasRenderingContext2D, sheet: HTMLImageElement, scale: number, sx: number, sy: number): void
}

function terrainSprite(tv: TerrainVariants): EditorSprite {
  return {
    draw(ctx, sheet, scale, sx, sy) {
      const cellW = CELL_W * scale
      const cellH = CELL_H * scale
      // Flat top face (no edge awareness in editor — just the base variant).
      ctx.drawImage(sheet,
        tv.topCols[0] * CELL_W, tv.row * CELL_H, CELL_W, CELL_H,
        sx * cellW, sy * cellH, cellW, cellH)
    },
  }
}

function staticSprite(col: number, row: number, h = 1): EditorSprite {
  return {
    draw(ctx, sheet, scale, sx, sy) {
      const cellW = CELL_W * scale
      const cellH = CELL_H * scale
      ctx.drawImage(sheet,
        col * CELL_W, row * CELL_H, CELL_W, CELL_H * h,
        sx * cellW, sy * cellH - (h - 1) * cellH, cellW, cellH * h)
    },
  }
}

export const EDITOR_SPRITES: Record<string, EditorSprite> = {
  dirt: terrainSprite(DIRT),
  sand: terrainSprite(SAND),
  stone: terrainSprite(STONE),
  water: terrainSprite(WATER),
  player: staticSprite(0, 6, 2),
}

/** Entity types available in the palette. */
export const PALETTE_TYPES = ['dirt', 'sand', 'stone', 'water', 'player']
