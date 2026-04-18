import type { TerrainDef } from './TerrainAtlas.js'

/**
 * Procedural terrain definitions.
 * Each function returns a TerrainDef with draw functions for atlas generation.
 *
 * TODO: Fill in actual pixel art per terrain type.
 */

function placeholder(fillColor: string, edgeColor: string): TerrainDef {
  return {
    top(ctx, w, h) {
      ctx.fillStyle = fillColor
      ctx.fillRect(0, 0, w, h)
    },
    front(ctx, w, h) {
      ctx.fillStyle = fillColor
      ctx.fillRect(0, 0, w, h)
    },
    unknownTop(ctx, w, h) {
      ctx.fillStyle = fillColor
      ctx.fillRect(0, 0, w, h)
      // Stipple pattern to indicate unknown
      ctx.fillStyle = edgeColor
      for (let x = 0; x < w; x += 2) {
        for (let y = 0; y < h; y += 2) {
          ctx.fillRect(x, y, 1, 1)
        }
      }
    },
    topEdge(ctx, _w, _h) {
      // W-edge: draw a 1px vertical line on the left
      ctx.fillStyle = edgeColor
      ctx.fillRect(0, 0, 1, _h)
    },
    topCorner(ctx, _w, _h) {
      // NW corner: erase the top-left pixel
      ctx.fillRect(0, 0, 1, 1)
    },
    frontEdge(ctx, _w, _h) {
      // W-edge: draw a 1px vertical line on the left
      ctx.fillStyle = edgeColor
      ctx.fillRect(0, 0, 1, _h)
    },
  }
}

export const DIRT_DEF: TerrainDef = placeholder('#a7814e', '#7f5845')
export const SAND_DEF: TerrainDef = placeholder('#c5a45f', '#a7814e')
export const GRASS_DEF: TerrainDef = placeholder('#a2af50', '#627c4e')
export const STONE_DEF: TerrainDef = placeholder('#7c877a', '#606762')
