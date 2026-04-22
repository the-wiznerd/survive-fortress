import type { VisibleTraitName } from '@repo/server/sdk'

/** Maps entity type → which traits to display in the inspector sidebar. */
export const ENTITY_TRAIT_NAMES: Record<string, VisibleTraitName[]> = {
  dirt: ['moisture', 'groundCover', 'position'],
  sand: ['moisture', 'position'],
  stone: ['position'],
  water: ['moisture', 'position'],
  player: ['health', 'hunger', 'movement', 'actor', 'equipment', 'position'],
  bush: ['harvestable', 'position'],
  berry: ['carriable', 'edible', 'position'],
  bag: ['carriable', 'wearable', 'container', 'position'],
}
