<template>
  <div class="plan-controls">
    <button
      type="button"
      class="clear"
      :disabled="!canClear"
      @click="onClear"
    >Clear</button>
    <button
      type="button"
      class="submit"
      :disabled="!canSubmit"
      @click="onSubmit"
    >Submit</button>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useGameStore } from '~client/stores/game'

  const game = useGameStore()

  const canClear = computed(() => game.phase === 'planning' && game.plan.length > 0)
  const canSubmit = computed(() => game.phase === 'planning')

  function onClear() { game.clearPlan() }
  function onSubmit() { game.submitPlan() }
</script>

<style lang="scss" scoped>
  .plan-controls {
    display: flex;
    gap: 0.5rem;

    button {
      flex: 1 1 0;
      font-family: var(--font-mono);
      font-size: 0.875rem;
      padding: 0.4rem 0.75rem;
      border: 1px solid var(--color-darkest-gray);
      background: var(--color-darkest-gray);
      color: var(--color-lightest-gray);
      cursor: pointer;
      transition: background 150ms ease, color 150ms ease, border-color 150ms ease;

      &:hover:not(:disabled) {
        background: var(--color-dark-gray);
        border-color: var(--color-dark-gray);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    .submit {
      background: var(--color-dark-green);
      border-color: var(--color-dark-green);
      color: var(--color-white);

      &:hover:not(:disabled) {
        background: var(--color-green);
        border-color: var(--color-green);
      }
    }
  }
</style>
