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
            @click="openBag"
          >{{ itemLabel(itemId) }}</button>
          <span v-else-if="itemId !== null">{{ itemLabel(itemId) }}</span>
          <span v-else class="empty">NONE</span>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
  import { inject } from 'vue'
  import type { Ref } from 'vue'
  import type { GameView, EntityId } from '@repo/server/sdk'
  import { pushSidebarView } from '~client/utils/sidebarStack'

  defineProps<{
    slots: Record<string, EntityId | null>
  }>()

  const view = inject<Ref<GameView | null>>('view')!

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

  function openBag() {
    pushSidebarView({ kind: 'bag' })
  }
</script>

<style lang="scss" scoped>
  @use '~styles/mixins';

  .equipment {
    >.label {
      @include mixins.label;
      margin: 0 0 0.25em;
      font-size: inherit;
      font-weight: normal;
    }
  }

  .slots {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
    list-style: none;
    padding: 0.5rem 0 0 0.5rem;
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
      text-underline-offset: 0.15em;
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
