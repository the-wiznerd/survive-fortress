import type { ViewEntity } from '@repo/server/sdk'

const EDGE: EdgeVariants = {
  row: 0,
  //           none  W   E  E+W   N  N+W  N+E N+E+W
  topCols: [0, 1, 2, 3, 5, 4, 6, 3],
  //           none  W    E  E+W
  frontCols: [9, 8, 10, 7],
}

const GRASS_EDGE: EdgeVariants = {
  row: 1,
  topCols: [0, 1, 2, 3, 5, 4, 6, 3],
  frontCols: [9, 8, 10, 7],
}

export class DirtRenderer extends EntityRenderer {
  readonly terrain = true

  render(entity: ViewEntity, dc: DrawContext) {
    dc.drawEdgeTerrain(EDGE)

    // Ground cover overlay (e.g. grass).
    const cover = entity.traits.groundCover?.cover as string | null | undefined
    if (cover === 'grass') {
      dc.drawEdgeTerrain(GRASS_EDGE)
    }
  }

  describeTraits(entity: ViewEntity): string[] {
    return ['moisture', 'groundCover']
  }
}
