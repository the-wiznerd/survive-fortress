<template>
  <div class="inspector-view">
    <div v-if="view" class="game-state">
      <div class="day"><span class="label">Day:</span> {{ day }}.{{ tickOfDay }}</div>
    </div>

    <EntityCard
      v-if="player"
      :entity="player"
      :collapsible="false"
    />

    <div v-if="selection" class="selection">
      <div v-if="selection.entities.length === 0" class="stat">Empty</div>
      <EntityCard
        v-for="e in selection.entities"
        :key="e.id"
        :entity="e"
      />
    </div>

    <SidebarSettings
      :scale="scale"
      :turn-mode="turnMode"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @turn-mode-change="setTurnMode"
    />

    <DebugPanel v-if="debugEnabled" />
  </div>
</template>

<script setup lang="ts">
  import { computed, inject } from 'vue'
  import type { Ref } from 'vue'
  import type { GameView, ViewEntity, InspectResult } from '@repo/server/sdk'
  import { TICKS_PER_DAY } from '@repo/server/sdk'
  import EntityCard from '~client/components/EntityCard.vue'
  import DebugPanel from '~client/components/DebugPanel.vue'
  import SidebarSettings from '~client/components/SidebarSettings.vue'
  import { DEBUG_ENABLED } from '~client/debug'

  const debugEnabled = DEBUG_ENABLED

  const view = inject<Ref<GameView | null>>('view')!
  const inspectedCell = inject<Ref<{ x: number; y: number } | null>>('inspectedCell')!
  const inspectResult = inject<Ref<InspectResult | null>>('inspectResult')!
  const scale = inject<Ref<number>>('scale')!
  const setScale = inject<(s: number) => void>('setScale')!
  const turnMode = inject<Ref<'manual' | 'auto'>>('turnMode')!
  const setTurnMode = inject<(mode: 'manual' | 'auto') => Promise<void>>('setTurnMode')!

  const zoomIn = () => setScale(scale.value + 1)
  const zoomOut = () => setScale(scale.value - 1)

  const day = computed(() => view.value ? Math.floor(view.value.tick / TICKS_PER_DAY) + 1 : 0)
  const tickOfDay = computed(() => view.value ? String(view.value.tick % TICKS_PER_DAY).padStart(2, '0') : '00')

  const player = computed<ViewEntity | null>(() => {
    if (!view.value) return null
    return view.value.entities.find(e => String(e.id) === view.value!.playerId) ?? null
  })

  const selection = computed(() => {
    if (!inspectResult.value || !inspectedCell.value) return null
    const playerId = view.value?.playerId
    return {
      ...inspectedCell.value,
      entities: inspectResult.value.entities
        .filter(e => !e.traits.contained && String(e.id) !== playerId)
        .sort((a, b) => b.z - a.z),
    }
  })
</script>

<style lang="scss" scoped>
  .inspector-view {
    padding: 1.5rem 1.5rem 0.5rem;
    line-height: 1.5;
    display: flex;
    flex-direction: column;
    min-height: 100%;
    box-sizing: border-box;
    background: var(--color-black);
  }

  .game-state {
    padding-block-end: 1rem;
    font-size: 1rem;
    font-weight: bold;

    .label {
      color: var(--color-white);
    }
  }

  .selection {
    padding-top: 2rem;
  }
</style>
