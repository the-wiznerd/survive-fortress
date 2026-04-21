<template>
  <Disclosure class="debug-panel">
    <template #label>
      Debug
    </template>
    
    <label>
      <input type="checkbox" :checked="showPositionTraits" @change="togglePosition"> Positions
    </label>

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
  </Disclosure>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { debugToggleMoisture, debugGetMoistureOverlay, debugForward, debugTogglePositionTraits, showPositionTraits } from '~client/debug'
  import Disclosure from './Disclosure.vue'

  const moistureOn = ref(debugGetMoistureOverlay())

  function togglePosition() {
    debugTogglePositionTraits()
  }

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

  label {
    display: block;
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
