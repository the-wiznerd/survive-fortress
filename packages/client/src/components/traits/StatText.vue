<template>
  <div class="stat --text">
    <span class="label">{{ label }}</span>
    <span class="value">{{ value }}</span>
  </div>
</template>

<script setup lang="ts">
  defineProps<{
    label: string
    value: string | number
  }>()
</script>

