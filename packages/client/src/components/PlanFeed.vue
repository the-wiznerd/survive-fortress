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
        :style="item.cost > 1 ? { gridRow: `span ${item.cost}` } : undefined"
      >
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
  import Icon from '~client/components/Icon.vue'
  import { useGameStore } from '~client/stores/game'

  const gameState = useGameStore()

  type SlotState = 'pending' | 'planning' | 'success' | 'failed' | 'empty'
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

  const items = computed<Item[]>(() => {
    const list: Item[] = []
    let used = 0

    if (gameState.phase === 'planning') {
      for (const a of gameState.plan) {
        const cost = gameState.actionCost(a)
        list.push({ kind: 'action', label: actionLabel(a), cost, state: 'planning' })
        used += cost
      }
      // Pad trailing AP with empty slots up to the budget.
      for (let i = used; i < apTotal.value; i++) {
        list.push({ kind: 'empty', cost: 1, state: 'empty' })
      }
      return list
    }

    // submitted | resolving — render the submitted plan, then fill any unused
    // AP with synthesized wait actions (the simulation idles those ticks).
    const progress = gameState.planProgress
    const isResolving = gameState.phase === 'resolving'
    const waitCost = gameState.actionCosts.wait ?? 1

    // Build a flat slot stream: the submitted actions, then waits to fill the
    // budget. Track each slot's planned-action index (waits get -1) so we can
    // tell, on termination, which planned actions never ran.
    const slots: { label: string; cost: number; plannedIdx: number }[] = []
    for (let i = 0; i < gameState.submittedPlan.length; i++) {
      const a = gameState.submittedPlan[i]!
      const cost = gameState.actionCost(a)
      slots.push({ label: actionLabel(a), cost, plannedIdx: i })
      used += cost
    }
    for (let s = used; s < apTotal.value; s += waitCost) {
      slots.push({ label: 'Wait', cost: waitCost, plannedIdx: -1 })
    }

    // The engine keeps ticking after a plan terminates — it just stops
    // executing this entity's remaining planned actions. Wait fillers resolve
    // normally as elapsedTicks advances. Planned actions at or after
    // progress.index reveal as failed only once their own tick frame elapses,
    // so the feed unfolds in lockstep with playback rather than collapsing
    // the whole tail to failed the moment the first one breaks.
    let tick = 0
    for (const slot of slots) {
      let state: SlotState = 'pending'
      if (isResolving && progress.elapsedTicks >= tick + slot.cost) {
        const isUnreachedPlannedAction =
          slot.plannedIdx >= 0
          && progress.terminated
          && slot.plannedIdx >= progress.index
        state = isUnreachedPlannedAction ? 'failed' : 'success'
      }
      list.push({ kind: 'action', label: slot.label, cost: slot.cost, state })
      tick += slot.cost
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
    @include pixel-sim-border;

    --border-color: var(--color-dark-blue);

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

  header,
  footer {
    padding: 0 pixel-sim-space(2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: pixel-sim-space(13);
  }

  header {
    @include ts-heading-secondary;
    padding: 0 pixel-sim-space(2);
    margin-block: 0;
    color: var(--color-white);
  }

  .slots {
    display: grid;
    grid-auto-columns: 1fr;
    grid-template-rows: repeat(var(--ap-total), minmax(pixel-sim-space(8), auto));
    min-inline-size: pixel-sim-space(40);
    margin: 0 4px;
    background-color: var(--color-darkest-blue);
  }

  .slot {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 pixel-sim-space(2);
    overflow: hidden;
    transition: background-color 0.2s ease, color 0.2s ease, opacity 0.2s ease, border-color 0.2s ease;
    border-width: var(--border-width) 0;
    border-style: dashed;
    border-color: transparent;
    color: var(--color-lightest-gray);
    margin-block-end: calc(var(--border-width) * -1);

    &:first-child {
      border-block-start-width: 0;
    }

    &:last-child {
      border-block-end-width: 0;
      margin-block-end: 0;
    }

    &.empty {
      border-style: dashed;
      border-color: var(--color-dark-blue);
    }

    &.action {
      border-color: var(--color-dark-blue);
    }

    &.-pending {
      border-style: solid;
      color: var(--color-light-gray);
    }

    &.-success {
      border-style: solid;
      color: var(--color-light-green);
    }

    &.-failed {
      border-style: solid;
      color: var(--color-light-red);
    }
  }

  .label {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  footer {
    display: flex;
    justify-content: space-between;
  }

  button {
    @include button-base;

    --border-color: var(--color-lightest-blue);
    background-color: transparent;
    color: var(--color-lightest-blue);

    &:hover,
    &:focus-visible {
      background-color: var(--color-light-blue);
      color: var(--color-black);
      --border-color: var(--color-light-blue);
    }
  }
</style>
