export class SpeedTraitRenderer extends TraitRenderer {
  render(id: EntityId, world: World): HTMLElement {
    const s = getComponent(world, id, 'speed')
    const el = document.createElement('stat-text')
    el.setAttribute('label', 'speed')
    el.setAttribute('value', s ? `1/${s.pace}` : '—')
    return el
  }
}
