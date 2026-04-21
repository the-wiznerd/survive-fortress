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
