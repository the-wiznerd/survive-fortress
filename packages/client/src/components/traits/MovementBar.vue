<template>
  <div class="stat --movement-bar">
    <span class="label">Movement:</span>
    <span class="segments">
      <span
        v-for="i in pace"
        :key="i"
        class="segment"
        :class="{ filled: i <= counter }"
      />
    </span>
  </div>
</template>

<script setup lang="ts">
  defineProps<{
    pace: number
    counter: number
  }>()
</script>
