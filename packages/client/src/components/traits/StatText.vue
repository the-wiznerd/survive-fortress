<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
}>()
</script>

<template>
  <div class="stat-text">
    <span class="label">{{ label }}</span>
    <span class="value">{{ value }}</span>
  </div>
</template>

<style scoped>
.stat-text {
  display: flex;
  justify-content: space-between;
  padding: 1px 0;
  font-size: 12px;
  line-height: 1.4;
}

.label {
  color: #888;
}

.value {
  color: #e0e0e0;
}
</style>
