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
      ctx.fillStyle = edgeColor
      for (let x = 0; x < w; x += 2) {
        for (let y = 0; y < h; y += 2) {
          ctx.fillRect(x, y, 1, 1)
        }
      }
    },
    topEdgeColor: edgeColor,
    frontEdgeColor: edgeColor,
  }
}
