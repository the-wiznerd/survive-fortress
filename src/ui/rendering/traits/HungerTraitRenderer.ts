export class HungerTraitRenderer extends TraitRenderer {
  render(id: EntityId, world: World): HTMLElement {
    const h = getComponent(world, id, 'hunger')
    const el = document.createElement('stat-text')
    el.setAttribute('label', 'hunger')
    el.setAttribute('value', h ? `${h.current}/${h.max}` : '—')
    return el
  }
}
