<template>
  <section class="plan-feed" :class="`-${gameState.phase}`" aria-label="Plan feed"
  :style="{ '--ap-total': apTotal }">
    <header>
      {{ phaseLabel }}
    </header>
    <div class="slots">
      <div
        v-for="(item, i) in items"
        :key="i"
        class="slot"
        :class="[`-${item.state}`, item.kind]"
      >
        <span class="status">
          <Icon v-if="item.state === 'success'" name="check" />
          <Icon v-else-if="item.state === 'failed'" name="x" />
          <template v-else>{{  i + 1 }}.</template>
        </span>
        <span v-if="item.kind === 'action'" class="label">{{ item.label }}</span>
      </div>
    </div>
    <footer>
      <button
        v-if="canSubmit"
        type="button"
        class="submit"
        @click="onSubmit"
      >
        <Icon name="check" />
        Submit
      </button>
      <button
        v-if="canClear"
        type="button"
        class="clear"
        @click="onClear"
        aria-label="Clear"
      >
        x
      </button>
    </footer>
  </section>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { PlayerAction } from '@repo/server/sdk'
  import { useGameStore } from '~client/stores/game'
  import Icon from './Icon.vue'

  const gameState = useGameStore()

  type SlotState = 'pending' | 'planning' | 'success' | 'failed' | 'empty'
  type Item =
    | { kind: 'action'; label: string; state: SlotState }
    | { kind: 'empty'; state: 'empty' }

  const phaseLabel = computed(() => {
    switch (gameState.phase) {
      case 'planning': return 'Planning'
      case 'submitted': return 'Submitted'
      case 'resolving': return 'Resolving'
    }
  })

  const apTotal = computed(() => gameState.actionPointsPerRound)

  const items = computed<Item[]>(() => {
    const list: Item[] = []
    let used = 0

    if (gameState.phase === 'planning') {
      for (const a of gameState.plan) {
        const cost = gameState.actionCost(a)
        const label = actionLabel(a)
        for (let c = 0; c < cost; c++) {
          list.push({ kind: 'action', label, state: 'planning' })
        }
        used += cost
      }
      // Pad trailing AP with empty slots up to the budget.
      for (let i = used; i < apTotal.value; i++) {
        list.push({ kind: 'empty', state: 'empty' })
      }
      return list
    }

    // submitted | resolving — render the submitted plan, then fill any unused
    // AP with synthesized wait actions (the simulation idles those ticks).
    const progress = gameState.planProgress
    const isResolving = gameState.phase === 'resolving'
    const waitCost = gameState.actionCosts.wait ?? 1

    // Build a flat per-tick slot stream so multi-AP actions appear as repeated
    // rows. Each slot tracks its absolute tick and the planned-action index it
    // belongs to (waits get -1) so we can mark unreached planned actions as
    // failed on termination.
    const slots: { label: string; tick: number; plannedIdx: number }[] = []
    for (let i = 0; i < gameState.submittedPlan.length; i++) {
      const a = gameState.submittedPlan[i]!
      const cost = gameState.actionCost(a)
      const label = actionLabel(a)
      for (let c = 0; c < cost; c++) {
        slots.push({ label, tick: used + c, plannedIdx: i })
      }
      used += cost
    }
    for (let s = used; s < apTotal.value; s += waitCost) {
      for (let c = 0; c < waitCost; c++) {
        slots.push({ label: 'Wait', tick: s + c, plannedIdx: -1 })
      }
    }

    // Each per-tick slot resolves as elapsedTicks crosses it. Planned actions
    // at or after progress.index reveal as failed only after their tick frame
    // elapses, so the feed unfolds in lockstep with playback.
    for (const slot of slots) {
      let state: SlotState = 'pending'
      if (isResolving && progress.elapsedTicks > slot.tick) {
        const isUnreachedPlannedAction =
          slot.plannedIdx >= 0
          && progress.terminated
          && slot.plannedIdx >= progress.index
        state = isUnreachedPlannedAction ? 'failed' : 'success'
      }
      list.push({ kind: 'action', label: slot.label, state })
    }
    return list
  })

  const canSubmit = computed(() => gameState.phase === 'planning')

  const canClear = computed(() => 
    gameState.phase === 'planning' && gameState.plan.length > 0
  )

  function actionLabel(a: PlayerAction): string {
    switch (a.type) {
      case 'move': return moveLabel(a.direction)
      case 'wait': return 'Wait'
      case 'harvest': return 'Harvest'
      case 'pickup': return 'Pick up'
      case 'drop': return 'Drop'
      case 'eat': return 'Eat'
    }
  }

  function moveLabel(direction: 'n' | 's' | 'e' | 'w'): string {
    switch (direction) {
      case 'n': return 'Move North'
      case 's': return 'Move South'
      case 'e': return 'Move East'
      case 'w': return 'Move West'
    }
  }

  function onClear() { gameState.clearPlan() }
  function onSubmit() { gameState.submitPlan() }
</script>

<style lang="scss" scoped>

  .plan-feed {
    color: var(--color-black);
    display: flex;
    flex-direction: column;
    transition: background-color 0.2s ease;
    background-color: var(--border-color);

    &.-planning { 
      --border-color: var(--color-dark-blue);
    }

    &.-submitted { 
      --border-color: var(--color-dark-yellow);
    }

    &.-resolving { 
      --border-color: var(--color-dark-green);
    }
  }

  header {
    @include ts-heading-secondary;
    display: flex;
    align-items: center;
    padding: pixel-sim-space(4) pixel-sim-space(5);
    color: var(--color-white);
  }

  .slots {
    display: grid;
    grid-auto-columns: 1fr;
    grid-template-rows: repeat(var(--ap-total), minmax(pixel-sim-space(6), auto));
    min-inline-size: pixel-sim-space(40);
    background-color: var(--color-darkest-blue);
    padding-block: pixel-sim-space(1);
  }

  .slot {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 pixel-sim-space(5);
    overflow: hidden;
    transition: background-color 0.2s ease, color 0.2s ease, opacity 0.2s ease, border-color 0.2s ease;
    color: var(--color-lightest-gray);

    .status {
      min-width: pixel-sim-space(6);
    }

    &.-pending {
      color: var(--color-light-gray);
    }

    &.-success {
      color: var(--color-light-green);
    }

    &.-failed {
      color: var(--color-light-red);
    }
  }

  .label {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  footer {
    padding: 0 pixel-sim-space(5);
    display: flex;
    align-items: center;
    justify-content: space-between;
    display: flex;
    justify-content: space-between;
    min-height: pixel-sim-space(14);
  }

  button {
    @include button-base;

    --border-color: var(--color-lightest-blue);
    background-color: transparent;
    color: var(--color-lightest-blue);
    margin: var(--border-width);

    &:hover,
    &:focus-visible {
      background-color: var(--color-light-blue);
      color: var(--color-black);
      --border-color: var(--color-light-blue);
    }
  }
</style>
