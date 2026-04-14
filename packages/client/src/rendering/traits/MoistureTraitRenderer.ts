export class MoistureTraitRenderer extends TraitRenderer {
  render(data: Record<string, unknown>): HTMLElement {
    const el = document.createElement('stat-text')
    el.setAttribute('label', 'moisture')
    el.setAttribute('value', `${data.current}/${data.capacity}`)
    return el
  }
}
