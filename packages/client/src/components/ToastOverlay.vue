<template>
  <Teleport to="body">
    <TransitionGroup tag="ul" name="toast" class="toast-overlay">
      <li
        v-for="t in toasts"
        :key="t.id"
        class="toast"
        :class="`-${t.kind}`"
      >{{ t.text }}</li>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
  import { useToasts } from '~client/composables/useToasts'

  const { toasts } = useToasts()
</script>

<style lang="scss" scoped>
  .toast-overlay {
    position: fixed;
    inset-block-start: pixel-sim-space(8);
    inset-inline: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: pixel-sim-space(2);
    pointer-events: none;
    z-index: 9999;
  }

  .toast {
    @include ts-heading-primary;
    padding: pixel-sim-space(3) pixel-sim-space(6);
    background: var(--color-black);
    color: var(--color-white);
    border: var(--border-width) solid var(--border-color);
    --border-color: var(--color-dark-gray);
    box-shadow: 0 pixel-sim-space(1) 0 rgb(0 0 0 / 50%);

    &.-pickup {
      --border-color: var(--color-light-green);
      color: var(--color-lightest-green);
    }
  }

  .toast-enter-active,
  .toast-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  .toast-enter-from {
    opacity: 0;
    transform: translateY(pixel-sim-space(-3));
  }
  .toast-leave-to {
    opacity: 0;
    transform: translateY(pixel-sim-space(-2));
  }
</style>
