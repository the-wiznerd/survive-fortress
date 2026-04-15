<script setup lang="ts">
import { computed, inject } from 'vue'
import type { Ref } from 'vue'
import type { GameView, ViewEntity, InspectResult } from '@repo/server/sdk'
import EntityCard from './EntityCard.vue'

const view = inject<Ref<GameView | null>>('view')!
const inspectedCell = inject<Ref<{ x: number; y: number } | null>>('inspectedCell')!
const inspectResult = inject<Ref<InspectResult | null>>('inspectResult')!

const TICKS_PER_DAY = 100

const day = computed(() => view.value ? Math.floor(view.value.tick / TICKS_PER_DAY) + 1 : 0)
const tickOfDay = computed(() => view.value ? String(view.value.tick % TICKS_PER_DAY).padStart(2, '0') : '00')

const player = computed<ViewEntity | null>(() => {
  if (!view.value) return null
  return view.value.entities.find(e => String(e.id) === view.value!.playerId) ?? null
})

const selection = computed(() => {
  if (!inspectResult.value || !inspectedCell.value) return null
  return {
    ...inspectedCell.value,
    entities: [...inspectResult.value.entities].sort((a, b) => b.z - a.z),
  }
})
</script>

<template>
  <aside id="sidebar">
    <h1>Survive Fortress</h1>

    <div v-if="view" class="section">
      <div class="stat"><span class="label">Day:</span> {{ day }}.{{ tickOfDay }}</div>
    </div>

    <div v-if="player" class="section">
      <EntityCard :entity="player" />
    </div>

    <div v-if="selection" class="section">
      <h2>Tile ({{ selection.x }}, {{ selection.y }})</h2>
      <div v-if="selection.entities.length === 0" class="stat">Empty</div>
      <EntityCard
        v-for="e in selection.entities"
        :key="e.id"
        :entity="e"
      />
    </div>
  </aside>
</template>

<style scoped>
#sidebar {
  width: 280px;
  padding: 1.5rem;
  background: #16213e;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.5;
}

h1, h2 {
  color: #87ceeb;
  margin-bottom: 0.5em;
  font-size: 14px;
}

.label {
  color: #888;
}

.section {
  margin-top: 16px;
}
</style>
