import type { ViewEntity, VisibleTraitName } from '@repo/server/sdk'

const DIRT = terrainVariants(0, 0)
const GRASS = terrainVariants(1, 0)

export class DirtRenderer extends EntityRenderer {
  readonly terrain = true

  render(entity: ViewEntity, dc: DrawContext) {
    dc.drawTerrain(DIRT)

    // Ground cover overlay (e.g. grass).
    const cover = entity.traits.groundCover?.cover as string | null | undefined
    if (cover === 'grass') {
      dc.drawTerrain(GRASS)
    }
  }

  describeTraits(entity: ViewEntity): VisibleTraitName[] {
    return ['moisture', 'groundCover', 'position']
  }
}
