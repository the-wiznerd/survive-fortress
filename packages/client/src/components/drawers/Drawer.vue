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

  .drawer {
    padding: pixel-sim-space(8) pixel-sim-space(6) pixel-sim-space(6);
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
    gap: pixel-sim-space(3);
    margin-block-end: pixel-sim-space(8);

    h2 {
      @include ts-heading-primary;
    }
  }

  .back {
    @include button-back-button;
    margin-block: pixel-sim-space(-3);
  }
</style>
