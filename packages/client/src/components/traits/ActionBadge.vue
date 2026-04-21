<template>
  <div class="action-badge">{{ action }}</div>
</template>

<script setup lang="ts">
  defineProps<{
    action: string
  }>()
</script>

<style lang="scss" scoped>
  .action-badge {
    display: inline-block;
    padding: 0.55rem 0.5rem 0.45rem;
    border-radius: 3px;
    font-size: 0.75rem;
    opacity: 0.85;
    background-color: var(--color-white);
    color: var(--color-black);
    line-height: 1;
    align-self: flex-start;
  }
</style>
