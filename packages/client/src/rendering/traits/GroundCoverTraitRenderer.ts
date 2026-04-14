export class GroundCoverTraitRenderer extends TraitRenderer {
  render(data: Record<string, unknown>): HTMLElement {
    const el = document.createElement('stat-text')
    el.setAttribute('label', 'cover')
    el.setAttribute('value', (data.cover as string) ?? 'none')
    return el
  }
}
