<template>
  <div class="debug-panel section">
    <h3>Debug</h3>
    <label>
      <input type="checkbox" :checked="moistureOn" @change="toggleMoisture"> Moisture overlay
    </label>
    <div class="debug-actions">
      <button @click="forward(0.5)">+½ day</button>
      <button @click="forward(1)">+1 day</button>
      <button @click="forward(5)">+5 days</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { debugToggleMoisture, debugGetMoistureOverlay, debugForward } from '~client/debug'

const moistureOn = ref(debugGetMoistureOverlay())

function toggleMoisture() {
  debugToggleMoisture()
  moistureOn.value = debugGetMoistureOverlay()
}

function forward(days: number) {
  debugForward(days)
}
</script>

<style scoped>
.debug-panel {
  border-top: 1px solid #444;
  padding-top: 8px;
  margin-top: 8px;
}
.debug-panel h3 {
  margin: 0 0 6px;
  font-size: 12px;
  color: #aaa;
  text-transform: uppercase;
}
.debug-panel label {
  display: block;
  font-size: 12px;
  margin-bottom: 6px;
  cursor: pointer;
}
.debug-actions {
  display: flex;
  gap: 4px;
}
.debug-actions button {
  font-size: 11px;
  padding: 2px 6px;
  cursor: pointer;
}
</style>
