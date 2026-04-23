<template>
  <div class="drawer">
    <header>
      <h2><slot name="title">{{ title}}</slot></h2>
      <button class="back" @click="$emit('close')">&lt; Back</button>
    </header>

    <slot />
  </div>
</template>

<script setup lang="ts">
  defineEmits<{
    (event: 'close'): void
  }>()

  defineProps<{
    title?: string
  }>()
</script>

<style lang="scss" scoped>
  @use '~styles/mixins';

  .drawer {
    padding: 1rem 1.5rem;
    display: flex;
    flex-direction: column;
    min-height: 100%;
    box-sizing: border-box;
    background: var(--color-black);
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-block-end: 1rem;

    h2 {
      @include mixins.heading-primary;
    }
  }

  .back {
    @include mixins.back-button;
    margin-block: -0.75rem;
  }

  .position {
    color: var(--color-gray);
    font-size: 0.875rem;
  }

  .empty {
    opacity: 0.6;
  }
</style>
