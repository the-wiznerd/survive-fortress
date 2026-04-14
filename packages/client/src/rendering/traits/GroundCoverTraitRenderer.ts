export class GroundCoverTraitRenderer extends TraitRenderer {
  render(id: EntityId, world: World): HTMLElement {
    const gc = getComponent(world, id, 'groundCover')
    const el = document.createElement('stat-text')
    el.setAttribute('label', 'cover')
    el.setAttribute('value', gc?.cover ?? 'none')
    return el
  }
}
