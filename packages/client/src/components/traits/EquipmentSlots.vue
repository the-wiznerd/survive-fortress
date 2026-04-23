<template>
  <div class="equipment">
    <h3 class="label">Equipment:</h3>
    <ul class="slots">
      <li v-for="(itemId, slot) in slots" :key="slot" class="slot">
        <span class="label">{{ slot }}</span>
        <span class="item">
          <button
            v-if="itemId !== null && isBag(itemId)"
            class="link"
            @click="openContainer(itemId)"
          >{{ itemLabel(itemId) }}</button>
          <span v-else-if="itemId !== null">{{ itemLabel(itemId) }}</span>
          <span v-else class="empty">NONE</span>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import type { EntityId } from '@repo/server/sdk'
  import { useGameStore } from '~client/stores/game'
  import { pushSidebarView } from '~client/utils/sidebarStack'

  defineProps<{
    slots: Record<string, EntityId | null>
  }>()

  const { view } = storeToRefs(useGameStore())

  function findEntity(id: EntityId) {
    return view.value?.entities.find(e => e.id === id) ?? null
  }

  function itemLabel(id: EntityId): string {
    const e = findEntity(id)
    if (!e) return `#${id}`
    return e.name ?? e.type
  }

  function isBag(id: EntityId): boolean {
    return !!findEntity(id)?.traits.container
  }

  function openContainer(id: EntityId) {
    pushSidebarView({ kind: 'container', containerId: id })
  }
</script>

<style lang="scss" scoped>

  .equipment {
    >.label {
      @include ts-label;
      font-size: inherit;
      font-weight: normal;
    }
  }

  .slots {
    display: flex;
    flex-direction: column;
    gap: pixel-sim-space(4);
    margin: 0;
    list-style: none;
    padding: pixel-sim-space(4) 0 0 pixel-sim-space(4);
  }

  .slot {
    .label {
      color: var(--color-light-gray);
      align-self: center;
      margin: 0 0.75ch 0 0;

      &::after { content: ':'; }
    }

    .item {
      margin: 0;
    }

    .link {
      background: none;
      border: none;
      color: inherit;
      font: inherit;
      padding: 0;
      cursor: pointer;
      text-transform: uppercase;
      text-underline-offset: 2px;
      text-decoration-thickness: var(--border-width);
      color: var(--color-light-blue);

      &:hover {
        color: var(--color-lightest-blue);
        text-decoration: underline;
      }
    }

    .empty {
      opacity: 0.5;
    }
  }
</style>
