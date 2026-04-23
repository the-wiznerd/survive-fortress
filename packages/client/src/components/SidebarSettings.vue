<template>
  <Disclosure class="settings">
    <template #label>
      Settings
    </template>

    <div class="stat">
      <span class="label">Zoom:</span>
      <button @click="$emit('zoom-out')" :disabled="scale <= 1">-</button>
      <span class="zoom-value">{{ scale }}x</span>
      <button @click="$emit('zoom-in')">+</button>
    </div>

    <div class="stat mode-picker">
      <span class="label">Turns:</span>
      <select :value="turnMode" @change="onTurnModeChange">
        <option value="manual">Manual</option>
        <option value="auto">Auto</option>
      </select>
    </div>

    <template v-if="debugEnabled">
      <label class="toggle">
        <input type="checkbox" :checked="showPositionTraits" @change="togglePosition"> Positions
      </label>

      <label class="toggle">
        <input type="checkbox" :checked="moistureOn" @change="toggleMoisture"> Moisture
      </label>

      <div class="stat debug-actions">
        <span class="label">FF:</span>
        <div class="buttons">
          <button @click="forward(0.5)">+0.5d</button>
          <button @click="forward(1)">+1d</button>
          <button @click="forward(5)">+5d</button>
        </div>
      </div>
    </template>
  </Disclosure>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import Disclosure from './Disclosure.vue'
  import {
    DEBUG_ENABLED,
    debugForward,
    debugGetMoistureOverlay,
    debugToggleMoisture,
    debugTogglePositionTraits,
    showPositionTraits,
  } from '~client/utils/debug'

  defineProps<{
    scale: number
    turnMode: 'manual' | 'auto'
  }>()

  const emit = defineEmits<{
    (e: 'zoom-in'): void
    (e: 'zoom-out'): void
    (e: 'turn-mode-change', mode: 'manual' | 'auto'): void
  }>()

  function onTurnModeChange(event: Event) {
    const mode = (event.target as HTMLSelectElement).value as 'manual' | 'auto'
    emit('turn-mode-change', mode)
  }

  const debugEnabled = DEBUG_ENABLED
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

  .settings {
    margin-block: auto 0;

    .label {
      margin-inline-end: 0.75ch;
    }

    button {
      background: var(--color-darkest-gray);
      color: var(--color-lightest-gray);
      font-family: var(--font-base);
      border: 0 none;
      padding: pixel-sim-space(1) pixel-sim-space(2);
      cursor: pointer;
      position: relative;
      inset-block-start: -1px;

      &:hover:not(:disabled) {
        background: var(--color-dark-gray);
      }

      &:disabled {
        opacity: 0.4;
        cursor: default;
      }
    }

    select {
      background: var(--color-darkest-gray);
      color: var(--color-lightest-gray);
      font-family: var(--font-base);
      border: 0 none;
      padding: pixel-sim-space(1) pixel-sim-space(2);
      text-transform: uppercase;
    }

    .zoom-value {
      display: inline-block;
      min-width: 2.5ch;
      text-align: center;
    }

    .toggle {
      display: block;
      cursor: pointer;
      @include ts-label;
    }

    .debug-actions {
      .buttons {
        display: inline-flex;
        gap: pixel-sim-space(1);
      }
    }
  }
</style>
