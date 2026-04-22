<template>
  <section class="plan-feed" :class="`phase-${gameState.phase}`" aria-label="Plan feed">
    <header class="phase-header">
      <span class="phase-name">{{ phaseLabel }}</span>
      <span class="ap-counter">{{ apUsed }} / {{ apTotal }}</span>
    </header>
    <div
      class="slots"
      :style="{ gridTemplateRows: `repeat(${apTotal}, minmax(1.6rem, auto))` }"
    >
      <div
        v-for="(item, i) in items"
        :key="i"
        class="slot"
        :class="[`state-${item.state}`, item.kind]"
        :style="item.cost > 1 ? { gridRow: `span ${item.cost}` } : undefined"
      >
        <span v-if="item.kind === 'action'" class="label">{{ item.label }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { ActionType, PlayerAction } from '@repo/server/sdk'
  import { useGameStore } from '~client/stores/game'

  const gameState = useGameStore()

  type SlotState = 'pending' | 'planning' | 'success' | 'failed' | 'cancelled' | 'empty'
  type Item =
    | { kind: 'action'; label: string; cost: number; state: SlotState }
    | { kind: 'empty'; cost: 1; state: 'empty' }

  const phaseLabel = computed(() => {
    switch (gameState.phase) {
      case 'planning': return 'Planning'
      case 'submitted': return 'Submitted'
      case 'resolving': return 'Resolving'
    }
  })

  const apTotal = computed(() => gameState.actionPointsPerRound)

  function costOf(type: ActionType): number {
    return gameState.actionCosts[type] ?? 1
  }

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

  /** AP consumed so far this round (sum of pending costs in planning;
   *  sum of completed-action costs during resolve). */
  const apUsed = computed(() => {
    if (gameState.phase === 'planning') return gameState.planCost
    let used = 0
    const max = Math.min(gameState.planProgress.index, gameState.submittedPlan.length)
    for (let i = 0; i < max; i++) used += costOf(gameState.submittedPlan[i]!.type)
    return used
  })

  /** Slots in left-to-right order. Each action item's `cost` drives `grid-column: span N`. */
  const items = computed<Item[]>(() => {
    const list: Item[] = []
    let used = 0

    if (gameState.phase === 'planning') {
      for (const a of gameState.plan) {
        const cost = costOf(a.type)
        list.push({ kind: 'action', label: actionLabel(a), cost, state: 'planning' })
        used += cost
      }
    } else {
      const progress = gameState.planProgress
      const isResolving = gameState.phase === 'resolving'
      for (let i = 0; i < gameState.submittedPlan.length; i++) {
        const a = gameState.submittedPlan[i]!
        const cost = costOf(a.type)
        let state: SlotState = 'pending'
        if (isResolving) {
          if (i < progress.index) state = 'success'
          else if (progress.terminated && i === progress.index) state = 'failed'
          else if (progress.terminated && i > progress.index) state = 'cancelled'
        }
        list.push({ kind: 'action', label: actionLabel(a), cost, state })
        used += cost
      }
    }

    // Pad trailing AP with empty slots up to the budget.
    for (let i = used; i < apTotal.value; i++) {
      list.push({ kind: 'empty', cost: 1, state: 'empty' })
    }
    return list
  })
</script>

<style lang="scss" scoped>
  .plan-feed {
    position: absolute;
    inset-block-end: 1rem;
    inset-inline-start: 1rem;
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
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .phase-planning .phase-header { background: var(--color-blue); }
  .phase-submitted .phase-header { background: var(--color-yellow); }
  .phase-resolving .phase-header { background: var(--color-green); }

  .ap-counter {
    font-variant-numeric: tabular-nums;
  }

  .slots {
    display: grid;
    gap: 2px;
    padding: 0.35rem;
    grid-auto-columns: 1fr;
    min-inline-size: 8rem;
  }

  .slot {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 0.5rem;
    font-size: 0.75rem;
    overflow: hidden;
    transition: background 200ms ease, color 200ms ease, opacity 200ms ease, border-color 200ms ease;
  }

  .slot.empty {
    background: transparent;
    border: 1px dashed var(--color-darkest-gray);
  }

  .slot.action {
    background: var(--color-darkest-gray);
    color: var(--color-lightest-gray);
    border: 1px solid var(--color-dark-gray);
  }

  .slot.state-pending {
    background: var(--color-darkest-gray);
    color: var(--color-light-gray);
  }

  .slot.state-success {
    background: var(--color-green);
    color: var(--color-black);
    border-color: var(--color-green);
  }

  .slot.state-failed {
    background: var(--color-red);
    color: var(--color-black);
    border-color: var(--color-red);
  }

  .slot.state-cancelled {
    background: transparent;
    color: var(--color-red);
    border: 1px dashed var(--color-red);
    opacity: 0.65;
  }

  .label {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  @media (prefers-reduced-motion: reduce) {
    .slot {
      transition: none;
    }
  }
</style>
