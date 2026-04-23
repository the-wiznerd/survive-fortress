<template>
  <section
    class="plan-feed" 
    :class="`-${gameState.phase}`"
    aria-label="Plan feed"
    :style="{ '--ap-rows': apRows }"
  >
    <header class="header">
      <span class="label">{{ phaseLabel }}</span>
      <span class="actions"> 
        <button
          v-if="canClear"
          type="button"
          class="clear"
          @click="onClear"
          aria-label="Clear"
        >
          x
        </button> 
        <button
          v-if="canSubmit"
          type="button"
          class="submit"
          @click="onSubmit"
        >
          <Icon name="check" />
          Submit
        </button>
      </span>
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
  </section>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { PlayerAction } from '@repo/server/sdk'
  import { useGameStore } from '~client/stores/game'
  import Icon from '~client/components/icons/Icon.vue'

  const gameState = useGameStore()

  type SlotState = 'pending' | 'planning' | 'success' | 'failed' | 'empty'
  type Item =
    | { kind: 'action'; label: string; state: SlotState }
    | { kind: 'empty'; state: 'empty' }

  const phaseLabel = computed(() => {
    switch (gameState.phase) {
      case 'planning': return 'Planning'
      case 'submitted': return 'Submitting...'
      case 'resolving': return 'Resolving'
    }
  })

  const apTotal = computed(() => gameState.actionPointsPerRound)
  const apRows = computed(() => Math.ceil(apTotal.value / 2))

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
      case 'harvest': return `Harvest ${targetLabel(a.targetId)}`
      case 'pickup': return `Pick up ${targetLabel(a.targetId)}`
      case 'drop': return `Drop ${targetLabel(a.targetId)}`
      case 'eat': return `Eat ${targetLabel(a.targetId)}`
    }
  }

  function targetLabel(id: number): string {
    const e = gameState.view?.entities.find(e => e.id === id)
    if (!e) return `#${id}`
    return e.name ?? e.type
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
      --border-color: var(--color-dark-green);
    }

    &.-submitted { 
      --border-color: var(--color-dark-blue);
    }

    &.-resolving { 
      --border-color: var(--color-dark-blue);
    }
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 pixel-sim-space(5);
    min-height: pixel-sim-space(12);
    
    > .label {
      @include ts-heading-secondary;
      color: var(--color-white);
    }

    > .actions {
      display: flex;
      align-items: center;
      gap: pixel-sim-space(1);
      margin-inline-end: var(--border-width);
    }
  }

  button {
    @include button-base;

    --border-color: var(--color-lightest-green);
    background-color: transparent;
    color: var(--color-lightest-green);
    margin: var(--border-width);

    &:hover,
    &:focus-visible {
      background-color: var(--color-light-green);
      color: var(--color-black);
      --border-color: var(--color-light-green);
    }
  }

  .slots {
    display: grid;
    grid-auto-flow: column;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: repeat(var(--ap-rows), minmax(pixel-sim-space(6), auto));
    min-inline-size: pixel-sim-space(40);
    background-color: var(--color-darkest-gray);
    padding: pixel-sim-space(2) pixel-sim-space(5);
    gap: pixel-sim-space(1);
  }

  .slot {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    overflow: hidden;
    transition: background-color 0.2s ease, color 0.2s ease, opacity 0.2s ease, border-color 0.2s ease;
    color: var(--color-lightest-gray);

    &.-pending {
      color: var(--color-light-gray);
    }

    &.-success {
      color: var(--color-light-green);
    }

    &.-failed {
      color: var(--color-light-red);
    }

    > .status {
      min-width: pixel-sim-space(6);
    }
  }

  .label {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
