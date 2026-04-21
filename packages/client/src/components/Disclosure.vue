<template>
  <details>
    <summary>
      <span class="label"><slot name="label" /></span>
      <span class="toggle" />
    </summary>
    <div class="content">
      <slot />
    </div>
  </details>
</template>

<style lang="scss" scoped>
  @use '~styles/mixins';

  details {
    border-block-start: 1px solid var(--color-darkest-gray);

    summary {
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      list-style: none;
      padding: 1rem 0;

      &::marker,
      &::-webkit-details-marker {
        display: none;
      }

      .label {
        @include mixins.heading;
        margin-block: 0;
      }

      .toggle {
        background: var(--color-darkest-gray);
        color: var(--color-lightest-gray);
        font-family: var(--font-mono);
        font-size: 0.75rem;
        height: 1.25rem;
        width: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;        
        user-select: none;        
        position: relative;
        inset-block-start: -1px;
        line-height: 1;

        &::after {
          content: '+';        
          display: inline-block;
          position: relative;
          inset-block-start: 1px;

        }
      }

      &:hover .toggle {
        background: var(--color-dark-gray);
      }
    }

    &[open] summary .toggle::after {
      content: '-';
    }

    .content {
      padding-block: 0 1rem;
      display: flex;
      flex-direction: column;
      gap: 1em;
    }
  }
</style>