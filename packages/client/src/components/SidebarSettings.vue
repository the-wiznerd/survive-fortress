<template>
  <div class="section settings">
    <div class="stat">
      <span class="label">Zoom:</span>
      <button @click="$emit('zoom-out')" :disabled="scale <= 1">-</button>
      <span class="zoom-value">{{ scale }}x</span>
      <button @click="$emit('zoom-in')">+</button>
    </div>
    <div class="stat mode-picker">
      <span class="label">Turns:</span>
      <select :value="turnMode" @change="onTurnModeChange">
        <option value="manual">Manual</option>
        <option value="auto">Auto</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineProps<{
    scale: number
    turnMode: 'manual' | 'auto'
  }>()

  const emit = defineEmits<{
    (e: 'zoom-in'): void
    (e: 'zoom-out'): void
    (e: 'turn-mode-change', mode: 'manual' | 'auto'): void
  }>()

  function onTurnModeChange(event: Event) {
    const mode = (event.target as HTMLSelectElement).value as 'manual' | 'auto'
    emit('turn-mode-change', mode)
  }
</script>

<style lang="scss" scoped>
  .settings {
    margin-block: auto 0;
    padding-block-start: 2rem;
    border-block-start: 1px solid var(--color-darkest-gray);

    .label {
      margin-inline-end: 0.75ch;
    }

    button {
      background: var(--color-darkest-gray);
      color: var(--color-lightest-gray);
      font-family: var(--font-mono);
      border: 0 none;
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      cursor: pointer;
      position: relative;
      inset-block-start: -1px;

      &:hover:not(:disabled) {
        background: var(--color-dark-gray);
      }

      &:disabled {
        opacity: 0.4;
        cursor: default;
      }
    }

    select {
      background: var(--color-darkest-gray);
      color: var(--color-lightest-gray);
      font-family: var(--font-mono);
      border: 0 none;
      font-size: 0.75rem;
      padding: 0.2rem 0.35rem;
      text-transform: uppercase;
    }

    .mode-picker {
      margin-block-start: 0.6rem;
    }

    .zoom-value {
      display: inline-block;
      min-width: 2.5ch;
      text-align: center;
    }
  }
</style>
