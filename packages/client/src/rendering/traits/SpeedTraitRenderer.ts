import { TraitRenderer } from './TraitRenderer.js'

export class SpeedTraitRenderer extends TraitRenderer {
  render(data: Record<string, unknown>): HTMLElement {
    const el = document.createElement('stat-text')
    el.setAttribute('label', 'speed')
    el.setAttribute('value', `1/${data.pace}`)
    return el
  }
}
