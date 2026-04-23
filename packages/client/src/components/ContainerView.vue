<template>
  <Drawer :title="title" @close="onClose">
    <div v-if="!container" class="empty">Container not found.</div>
    <template v-else>
      <div class="capacity stat">
        <span class="label">Capacity:</span>
        <span class="value">{{ capacity.used }}/{{ capacity.total }}</span>
      </div>
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
    </template>
  </Drawer>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import type { EntityId, ViewEntity } from '@repo/server/sdk'
  import EntityCard from '~client/components/EntityCard.vue'
  import Drawer from '~client/components/drawers/Drawer.vue'
  import { useGameStore } from '~client/stores/game'
  import { popSidebarView } from '~client/utils/sidebarStack'

  const props = defineProps<{
    containerId: EntityId
  }>()

  const gameStore = useGameStore()
  const { view } = storeToRefs(gameStore)

  const expandedId = ref<EntityId | null>(null)
  const phase = computed(() => gameStore.phase)

  const container = computed<ViewEntity | null>(() => {
    const v = view.value
    if (!v) return null
    const entity = v.entities.find(e => e.id === props.containerId) ?? null
    return entity?.traits.container ? entity : null
  })

  const title = computed(() => {
    const c = container.value
    if (!c) return 'Container'
    return c.name ?? c.type
  })

  const capacity = computed(() => {
    const c = container.value?.traits.container
    return { used: c?.usedCapacity ?? 0, total: c?.capacity ?? 0 }
  })

  const items = computed<ViewEntity[]>(() => {
    const v = view.value
    const c = container.value
    if (!v || !c?.traits.container) return []
    const ids = new Set(c.traits.container.contents)
    return v.entities.filter(e => ids.has(e.id))
  })

  function itemLabel(item: ViewEntity): string {
    return item.name ? `${item.name} (${item.type})` : item.type
  }

  function toggle(item: ViewEntity) {
    expandedId.value = expandedId.value === item.id ? null : item.id
  }

  function eat(item: ViewEntity) {
    gameStore.appendEat(item.id)
  }

  function drop(item: ViewEntity) {
    gameStore.appendDrop(item.id, 0, 0)
  }

  function onClose() {
    popSidebarView()
  }
</script>

<style lang="scss" scoped>
  .capacity {
    margin-block-end: pixel-sim-space(4);
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
    gap: pixel-sim-space(1);
  }

  .item {
    display: flex;
    flex-direction: column;
  }

  .item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: pixel-sim-space(2);

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
    gap: pixel-sim-space(1);
  }

  .action {
    background: var(--color-darkest-gray);
    color: inherit;
    border: 1px solid var(--color-dark-gray);
    font: inherit;
    padding: pixel-sim-space(1) pixel-sim-space(2);
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
    margin-top: pixel-sim-space(1);
    margin-left: pixel-sim-space(4);
  }
</style>
