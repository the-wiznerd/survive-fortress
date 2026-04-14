export class EntityCard extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 4px;
          padding: 8px 10px;
          margin-bottom: 8px;
        }
        .label {
          color: #87ceeb;
          font-weight: bold;
          font-size: 13px;
          text-transform: capitalize;
        }
        .traits {
          margin-top: 4px;
        }
        .traits:empty {
          display: none;
        }
      </style>
      <div class="label"></div>
      <div class="traits"><slot></slot></div>
    `
    shadow.querySelector('.label')!.textContent = this.getAttribute('label') ?? ''
  }
}

customElements.define('entity-card', EntityCard)
