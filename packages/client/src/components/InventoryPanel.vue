<template>
  <div v-if="bag" class="inventory">
    <h2 class="label">{{ bagLabel }}</h2>
    <div v-if="items.length === 0" class="empty">Empty</div>
    <ul v-else class="items">
      <li
        v-for="item in items"
        :key="item.id"
        class="item"
      >
        <div class="item-row" :class="{ selected: expandedId === item.id }">
          <button class="item-label" @click="toggle(item)">
            {{ itemLabel(item) }}
          </button>
          <div class="item-actions">
            <button
              v-if="item.traits.edible"
              class="action"
              :disabled="phase !== 'planning'"
              @click="eat(item)"
            >eat</button>
            <button
              class="action"
              :disabled="phase !== 'planning'"
              @click="drop(item)"
            >drop</button>
          </div>
        </div>
        <EntityCard v-if="expandedId === item.id" :entity="item" class="expanded" />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
  import { computed, inject, ref } from 'vue'
  import type { Ref } from 'vue'
  import type { GameView, ViewEntity } from '@repo/server/sdk'
  import { appendDrop, appendEat, gameState } from '~client/game'
  import EntityCard from '~client/components/EntityCard.vue'

  const view = inject<Ref<GameView | null>>('view')!
  const expandedId = ref<number | null>(null)

  const phase = computed(() => gameState.phase)

  const player = computed<ViewEntity | null>(() => {
    const v = view.value
    if (!v) return null
    return v.entities.find(e => String(e.id) === v.playerId) ?? null
  })

  /** The entity acting as the player's primary storage — either a Container
   *  trait directly on the player, or the first equipped item with a Container. */
  const bag = computed<ViewEntity | null>(() => {
    const v = view.value
    const p = player.value
    if (!v || !p) return null
    if (p.traits.container) return p
    const slots = p.traits.equipment?.slots
    if (!slots) return null
    for (const id of Object.values(slots)) {
      if (id == null) continue
      const item = v.entities.find(e => e.id === id)
      if (item?.traits.container) return item
    }
    return null
  })

  const bagLabel = computed(() => {
    const b = bag.value
    if (!b?.traits.container) return 'Bag'
    const c = b.traits.container
    const name = b === player.value ? 'Bag' : (b.name ?? b.type)
    return `${name} (${c.usedCapacity}/${c.capacity})`
  })

  const items = computed<ViewEntity[]>(() => {
    const v = view.value
    const b = bag.value
    if (!v || !b?.traits.container) return []
    const ids = new Set(b.traits.container.contents)
    return v.entities.filter(e => ids.has(e.id))
  })

  function itemLabel(item: ViewEntity): string {
    return item.name ? `${item.name} (${item.type})` : item.type
  }

  function toggle(item: ViewEntity) {
    expandedId.value = expandedId.value === item.id ? null : item.id
  }

  function eat(item: ViewEntity) {
    appendEat(item.id)
  }

  function drop(item: ViewEntity) {
    appendDrop(item.id, 0, 0)
  }
</script>

<style lang="scss" scoped>
  @use '~styles/mixins';

  .inventory {
    >.label {
      @include mixins.heading;
    }

    .empty {
      opacity: 0.6;
    }

    .items {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25em;
    }

    .item {
      display: flex;
      flex-direction: column;
    }

    .item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5em;

      &.selected .item-label {
        color: var(--color-light-gray);
      }
    }

    .item-label {
      background: none;
      border: none;
      color: inherit;
      font: inherit;
      cursor: pointer;
      padding: 0;
      text-align: left;
      flex: 1;

      &:hover {
        text-decoration: underline;
      }
    }

    .item-actions {
      display: flex;
      gap: 0.25em;
    }

    .action {
      background: var(--color-darkest-gray);
      color: inherit;
      border: 1px solid var(--color-dark-gray);
      font: inherit;
      padding: 0.1em 0.4em;
      cursor: pointer;

      &:hover:not(:disabled) {
        background: var(--color-dark-gray);
      }

      &:disabled {
        opacity: 0.4;
        cursor: default;
      }
    }

    .expanded {
      margin-top: 0.25em;
      margin-left: 1em;
    }
  }
</style>
