<template>
  <section class="plan-feed" :class="`phase-${gameState.phase}`" aria-label="Plan feed">
    <header class="phase-header">
      <span class="phase-name">{{ phaseLabel }}</span>
    </header>
    <ol class="rows" :class="{ empty: !rows.length }">
      <TransitionGroup name="row">
        <li
          v-for="row in rows"
          :key="row.id"
          class="row"
          :class="{
            pending: row.state === 'pending',
            success: row.state === 'success',
            failed: row.state === 'failed',
            cancelled: row.state === 'cancelled',
          }"
          :style="row.state === 'cancelled' ? { transitionDelay: `${row.cancelDelayMs}ms` } : undefined"
        >
          <span class="label">{{ row.label }}</span>
        </li>
      </TransitionGroup>
      <li v-if="!rows.length && gameState.phase === 'planning'" class="hint">Enter actions</li>
    </ol>
  </section>
</template>

<script setup lang="ts">
  import { computed, watch } from 'vue'
  import type { PlayerAction } from '@repo/server/sdk'
  import { useGameStore } from '~client/stores/game'

  const gameState = useGameStore()

  type RowState = 'pending' | 'success' | 'failed' | 'cancelled'

  interface Row {
    id: number
    label: string
    state: RowState
    /** Stagger ms applied when transitioning a cancelled row out. */
    cancelDelayMs: number
  }

  // Stable per-row IDs so Vue's TransitionGroup can animate insertions/removals.
  let nextRowId = 1
  const planningRowIds: number[] = []
  let submittedRowIds: number[] = []
  /** IDs of rows that have completed/failed/cancelled and should no longer render. */
  const exitingRowIds = new Set<number>()

  // Keep planning row IDs aligned with the planning plan length (append new IDs as actions are added).
  watch(() => gameState.plan.length, (length) => {
    if (length > planningRowIds.length) {
      const toAdd = length - planningRowIds.length
      for (let i = 0; i < toAdd; i++) planningRowIds.push(nextRowId++)
    } else if (length < planningRowIds.length) {
      planningRowIds.splice(length)
    }
  }, { immediate: true })

  // Allocate fresh IDs for the submitted plan so resolve animations are scoped to those rows.
  watch(() => gameState.submittedPlan, (next) => {
    exitingRowIds.clear()
    submittedRowIds = next.length === 0
      ? []
      : Array.from({ length: next.length }, () => nextRowId++)
  })

  const phaseLabel = computed(() => {
    switch (gameState.phase) {
      case 'planning': return 'Planning'
      case 'submitted': return 'Submitted'
      case 'resolving': return 'Resolving'
    }
  })

  function actionLabel(a: PlayerAction): string {
    switch (a.type) {
      case 'move': return moveLabel(a.dx, a.dy)
      case 'wait': return 'Wait'
      case 'harvest': return 'Harvest'
      case 'pickup': return 'Pick up'
      case 'drop': return 'Drop'
      case 'eat': return 'Eat'
    }
  }

  function moveLabel(dx: number, dy: number): string {
    const parts: string[] = []
    if (dy < 0) parts.push('N')
    if (dy > 0) parts.push('S')
    if (dx > 0) parts.push('E')
    if (dx < 0) parts.push('W')
    return parts.length ? `Move ${parts.join('')}` : 'Wait'
  }

  // Build the visible row list based on current phase.
  const rows = computed<Row[]>(() => {
    if (gameState.phase === 'planning') {
      return gameState.plan.map((a, i) => ({
        id: planningRowIds[i] ?? -i - 1,
        label: actionLabel(a),
        state: 'pending' as RowState,
        cancelDelayMs: 0,
      }))
    }

    // submitted | resolving — render submitted plan minus rows that have already exited.
    const live: Row[] = []
    const progress = gameState.planProgress
    for (let i = 0; i < gameState.submittedPlan.length; i++) {
      const id = submittedRowIds[i] ?? -i - 1
      if (exitingRowIds.has(id)) continue

      let state: RowState = 'pending'
      let cancelDelayMs = 0
      if (gameState.phase === 'resolving') {
        if (i < progress.index) {
          state = 'success'
        } else if (progress.terminated && i === progress.index) {
          state = 'failed'
        } else if (progress.terminated && i > progress.index) {
          state = 'cancelled'
          cancelDelayMs = (i - progress.index) * 60
        }
      }
      live.push({
        id,
        label: actionLabel(gameState.submittedPlan[i]!),
        state,
        cancelDelayMs,
      })
    }
    return live
  })

  // When progress advances during resolving, mark the just-resolved row(s) success and remove them after a brief flash.
  let lastResolvedIndex = 0
  watch(
    () => ({ phase: gameState.phase, index: gameState.planProgress.index, terminated: gameState.planProgress.terminated }),
    (next, prev) => {
      if (next.phase !== 'resolving') {
        lastResolvedIndex = 0
        return
      }
      if (prev?.phase !== 'resolving') lastResolvedIndex = 0

      while (lastResolvedIndex < next.index) {
        const i = lastResolvedIndex
        const id = submittedRowIds[i]
        if (id != null) setTimeout(() => exitingRowIds.add(id), 250)
        lastResolvedIndex++
      }

      if (next.terminated) {
        // Schedule the failed row + cancelled tail to exit after their flash/stagger.
        const failedIndex = next.index
        const tail = gameState.submittedPlan.length - failedIndex
        for (let k = 0; k < tail; k++) {
          const i = failedIndex + k
          const id = submittedRowIds[i]
          if (id == null) continue
          const delay = k === 0 ? 400 : 400 + k * 60
          setTimeout(() => exitingRowIds.add(id), delay)
        }
      }
    },
  )
</script>

<style lang="scss" scoped>
  .plan-feed {
    position: absolute;
    inset-block-end: 1rem;
    inset-inline-start: 1rem;
    min-inline-size: 12rem;
    max-inline-size: 16rem;
    background: var(--color-black);
    border: 1px solid var(--color-darkest-gray);
    display: flex;
    flex-direction: column;
    pointer-events: auto;
    user-select: none;
  }

  .phase-header {
    padding: 0.4rem 0.6rem;
    font-weight: bold;
    color: var(--color-black);
    background: var(--color-darkest-gray);
    transition: background 150ms ease;
  }

  .phase-planning .phase-header { background: var(--color-blue); }
  .phase-submitted .phase-header { background: var(--color-yellow); }
  .phase-resolving .phase-header { background: var(--color-green); }

  .rows {
    list-style: none;
    margin: 0;
    padding: 0.25rem 0;
    display: flex;
    flex-direction: column;

    &.empty {
      padding: 0.25rem 0;
    }
  }

  .row {
    padding: 0.3rem 0.6rem;
    color: var(--color-lightest-gray);
    border-block-start: 1px solid transparent;
    transition: background 150ms ease, color 150ms ease, opacity 200ms ease, transform 200ms ease;

    &.success {
      background: var(--color-green);
      color: var(--color-black);
    }
    &.failed {
      background: var(--color-red);
      color: var(--color-black);
    }
    &.cancelled {
      background: transparent;
      color: var(--color-red);
      opacity: 0.6;
    }
  }

  .hint {
    padding: 0.3rem 0.6rem;
    color: var(--color-dark-gray);
    font-style: italic;
    list-style: none;
  }

  // TransitionGroup animations.
  .row-enter-from {
    opacity: 0;
    transform: translateX(-0.5rem);
  }
  .row-enter-active {
    transition: opacity 150ms ease, transform 150ms ease;
  }
  .row-leave-active {
    transition: opacity 200ms ease, transform 200ms ease;
    position: absolute; // collapse out of flow so siblings shift smoothly
    inline-size: calc(100% - 1.2rem);
  }
  .row-leave-to {
    opacity: 0;
    transform: translateX(-1rem);
  }

  @media (prefers-reduced-motion: reduce) {
    .row,
    .row-enter-active,
    .row-leave-active {
      transition: none;
    }
  }
</style>
