<template>
  <button
    class="action-button"
    :class="{ '-queued': queued }"
    :disabled="disabled"
    @click="onClick"
  >
    <Icon v-if="queued" name="check" class="queued-icon" />
    <span class="label">{{ label }}</span>
    <span class="cost">{{ cost }}<Icon name="ap" label="action points" /></span>
  </button>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { PlayerAction } from '@repo/server/sdk'
  import Icon from '~client/components/icons/Icon.vue'
  import { useGameStore } from '~client/stores/game'

  const props = defineProps<{
    label: string
    action: PlayerAction
  }>()

  const game = useGameStore()
  const cost = computed(() => game.actionCost(props.action))
  const queued = computed(() => isQueued(game.plan, props.action))
  const affordable = computed(() => game.canAfford(props.action))

  const disabled = computed(() => {
    if (game.phase !== 'planning') return true
    if (queued.value) return false
    if (!affordable.value) return true
    return false
  })

  function onClick() {
    if (disabled.value) return
    if (queued.value) {
      game.removeFromPlan(props.action)
      return
    }
    const a = props.action
    switch (a.type) {
      case 'harvest': game.appendHarvest(a.targetId); break
      case 'pickup':  game.appendPickup(a.targetId); break
      case 'eat':     game.appendEat(a.targetId); break
      case 'drop':    game.appendDrop(a.targetId, a.dx, a.dy); break
      case 'wait':    /* not button-driven */ break
      case 'move':    /* not button-driven */ break
    }
  }

  /** Whether an equivalent action is already in the plan (mirrors store guards).
   *  `eat` is intentionally absent: stacked items can be eaten multiple times
   *  per turn, so the eat button stays clickable until the stack is exhausted
   *  or AP runs out. Removal happens via the PlanFeed slot. */
  function isQueued(plan: readonly PlayerAction[], a: PlayerAction): boolean {
    switch (a.type) {
      case 'harvest':
      case 'pickup':
      case 'drop':
        return plan.some(p => p.type === a.type && 'targetId' in p && p.targetId === a.targetId)
      default:
        return false
    }
  }
</script>

<style lang="scss" scoped>
  .action-button {
    @include button-base;


    // // Queued state stays at full opacity — the check icon carries the meaning.
    // &.-queued:disabled {
    //   opacity: 1;
    //   cursor: default;
    //   color: var(--color-dark-gray);
    // }

    &.-queued {
      --border-color: var(--color-lightest-green);
      background: var(--color-dark-green);
      color: var(--color-lightest-green);
    }

    > .label {
      flex: 1;
      text-align: left;
    }
  }

  .queued-icon {
    color: var(--color-lightest-green);
  }

  .cost {
    display: inline-flex;
    align-items: center;
    gap: pixel-sim-space(1);
  }
</style>
