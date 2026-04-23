<template>
  <div class="stat --movement-bar" v-for="(mode, idx) in modes" :key="idx">
    <span class="label">{{ mode.locomotion }}:</span>
    <span class="segments">
      <span
        v-for="i in (mode.pace - 1)"
        :key="i"
        class="segment"
      />
    </span>
  </div>
</template>

<script setup lang="ts">
  import type { MovementMode } from '@repo/server/sdk'

  defineProps<{
    modes: MovementMode[]
  }>()
</script>

<style lang="scss" scoped>
  .segments {
    display: inline-flex;
    gap: pixel-sim-space(1);
  }

  .segment {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: var(--border-width) solid var(--color-gray);
    position: relative;

    &.filled {
      background: var(--color-lightest-gray);
      border-color: var(--color-lightest-gray);
    }
  }
</style>