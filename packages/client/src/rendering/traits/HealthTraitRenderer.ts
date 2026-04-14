import { TraitRenderer } from './TraitRenderer.js'

export class HealthTraitRenderer extends TraitRenderer {
  render(data: Record<string, unknown>): HTMLElement {
    const el = document.createElement('stat-text')
    el.setAttribute('label', 'health')
    el.setAttribute('value', `${data.current}/${data.max}`)
    return el
  }
}
