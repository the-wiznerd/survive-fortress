<template>
  <div class="debug-panel section">
    <h2>Debug</h2>
    <label>
      <input type="checkbox" :checked="moistureOn" @change="toggleMoisture"> Moisture
    </label>
    <div class="debug-actions">
       <span class="label">
        FF:
      </span>
      <div class="buttons">
        <button @click="forward(0.5)">+0.5 d</button>
        <button @click="forward(1)">+1 d</button>
        <button @click="forward(5)">+5 d</button>
      </div>
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

<style lang="scss" scoped>
  @use '~styles/mixins';

  .debug-panel {
    border-block-start: 1px solid #444;
    padding-block-start: 1rem;
    margin-block: 1.25rem 0;
  }

  h2 {
    @include mixins.heading;
  }

  label {
    display: block;
    margin-block-end: 0.5rem;
    cursor: pointer;
  }

  label,
  .label {
    @include mixins.label;
  }

  .debug-actions {
    display: flex;
    align-items: center;
    gap: 0.75ch;

    .buttons {
      display: flex;
      gap: 0.25rem;
    }

    button {
      font-size: 11px;
      padding: 2px 6px;
      cursor: pointer;
    }
  }
</style>
