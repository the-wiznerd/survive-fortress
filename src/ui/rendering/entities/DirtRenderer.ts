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

  render(id: EntityId, dc: DrawContext) {
    dc.drawEdgeTerrain(EDGE)

    // Ground cover overlay (e.g. grass).
    const cover = getComponent(dc.rc.world, id, 'groundCover')
    if (cover?.cover === 'grass') {
      dc.drawEdgeTerrain(GRASS_EDGE)
    }
  }

  describe(id: EntityId, world: World): string[] {
    return ['moisture', 'groundCover']
  }
}
