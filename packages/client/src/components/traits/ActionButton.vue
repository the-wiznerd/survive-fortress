<template>
  <button
    class="action-button"
    :disabled="disabled"
    :title="title"
    @click="onClick"
  >
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
    if (queued.value) return true
    if (!affordable.value) return true
    return false
  })

  const title = computed(() => {
    if (game.phase !== 'planning') return 'Submit your plan to start planning a new one'
    if (queued.value) return 'Already in plan'
    if (!affordable.value) return 'Not enough action points remaining'
    return `Add ${props.label} (${cost.value} AP) to plan`
  })

  function onClick() {
    if (disabled.value) return
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

  /** Whether an equivalent action is already in the plan (mirrors store guards). */
  function isQueued(plan: readonly PlayerAction[], a: PlayerAction): boolean {
    switch (a.type) {
      case 'harvest':
      case 'pickup':
      case 'eat':
      case 'drop':
        return plan.some(p => p.type === a.type && 'targetId' in p && p.targetId === a.targetId)
      default:
        return false
    }
  }
</script>

<style lang="scss" scoped>
  .action-button {
    display: inline-flex;
    align-items: center;
    gap: pixel-sim-space(2);
    padding: pixel-sim-space(2) pixel-sim-space(3);
    border: 0 none;
    border-radius: 3px;
    font-family: inherit;
    background-color: var(--color-white);
    color: var(--color-black);
    cursor: pointer;
    align-self: flex-start;

    &:hover:not(:disabled) {
      background-color: var(--color-lightest-gray);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  .cost {
    display: inline-flex;
    align-items: center;
    gap: pixel-sim-space(1);
    opacity: 0.7;
    text-transform: uppercase;
  }
</style>
