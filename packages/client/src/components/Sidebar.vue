<template>
  <aside id="sidebar">
    <div v-if="view" class="section">
      <div class="stat"><span class="label">Day:</span> {{ day }}.{{ tickOfDay }}</div>
    </div>

    <div v-if="player" class="section">
      <EntityCard :entity="player" />
    </div>

    <div v-if="selection" class="section">
      <div v-if="selection.entities.length === 0" class="stat">Empty</div>
      <EntityCard
        v-for="e in selection.entities"
        :key="e.id"
        :entity="e"
      />
    </div>

    <div class="section settings">
      <div class="stat">
        <span class="label">Zoom:</span>
        <button @click="zoomOut" :disabled="scale <= 1">-</button>
        <span class="zoom-value">{{ scale }}x</span>
        <button @click="zoomIn">+</button>
      </div>
    </div>

    <DebugPanel v-if="debugEnabled" />
  </aside>
</template>

<script setup lang="ts">
  import { computed, inject } from 'vue'
  import type { Ref } from 'vue'
  import type { GameView, ViewEntity, InspectResult } from '@repo/server/sdk'
  import EntityCard from '~client/components/EntityCard.vue'
  import DebugPanel from '~client/components/DebugPanel.vue'
  import { DEBUG_ENABLED } from '~client/debug'

  const debugEnabled = DEBUG_ENABLED

  const view = inject<Ref<GameView | null>>('view')!
  const inspectedCell = inject<Ref<{ x: number; y: number } | null>>('inspectedCell')!
  const inspectResult = inject<Ref<InspectResult | null>>('inspectResult')!
  const scale = inject<Ref<number>>('scale')!
  const setScale = inject<(s: number) => void>('setScale')!

  const zoomIn = () => setScale(scale.value + 1)
  const zoomOut = () => setScale(scale.value - 1)

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
