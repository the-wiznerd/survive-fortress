export class HealthTraitRenderer extends TraitRenderer {
  render(id: EntityId, world: World): HTMLElement {
    const h = getComponent(world, id, 'health')
    const el = document.createElement('stat-text')
    el.setAttribute('label', 'health')
    el.setAttribute('value', h ? `${h.current}/${h.max}` : '—')
    return el
  }
}
