import { TraitRenderer } from './TraitRenderer.js'

export class HungerTraitRenderer extends TraitRenderer {
  render(data: Record<string, unknown>): HTMLElement {
    const el = document.createElement('stat-text')
    el.setAttribute('label', 'hunger')
    el.setAttribute('value', `${data.current}/${data.max}`)
    return el
  }
}
