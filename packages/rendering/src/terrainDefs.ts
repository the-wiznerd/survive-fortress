import type { TerrainDef } from './TerrainAtlas.js'

/**
 * Placeholder terrain draw functions.
 * Used by renderers until real pixel art is filled in.
 */
export function placeholder(fillColor: string, edgeColor: string): TerrainDef {
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
