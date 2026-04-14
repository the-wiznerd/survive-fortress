const EDGE: EdgeVariants = {
  row: 1,
  topCols: [11, 12, 13, 14, 16, 15, 17, 14],
  frontCols: [20, 19, 21, 18],
}

export class StoneRenderer extends EntityRenderer {
  readonly terrain = true

  render(id: EntityId, dc: DrawContext) {
    dc.drawEdgeTerrain(EDGE)
  }
}
