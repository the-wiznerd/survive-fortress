/**
 * <stat-text label="health" value="80/100"></stat-text>
 *
 * Simple label + value display for entity cards.
 */
export class StatText extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = `
      <style>
        :host {
          display: flex;
          justify-content: space-between;
          padding: 1px 0;
          font-size: 12px;
          line-height: 1.4;
        }
        .label {
          color: #888;
        }
        .value {
          color: #e0e0e0;
        }
      </style>
      <span class="label"></span>
      <span class="value"></span>
    `
    this.update()
  }

  static get observedAttributes() { return ['label', 'value'] }
  attributeChangedCallback() { if (this.shadowRoot) this.update() }

  private update() {
    this.shadowRoot!.querySelector('.label')!.textContent = this.getAttribute('label') ?? ''
    this.shadowRoot!.querySelector('.value')!.textContent = this.getAttribute('value') ?? ''
  }
}

customElements.define('stat-text', StatText)
