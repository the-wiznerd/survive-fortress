export class MoistureTraitRenderer extends TraitRenderer {
  render(id: EntityId, world: World): HTMLElement {
    const m = getComponent(world, id, 'moisture')
    const el = document.createElement('stat-text')
    el.setAttribute('label', 'moisture')
    el.setAttribute('value', m ? `${m.current}/${m.capacity}` : '—')
    return el
  }
}
