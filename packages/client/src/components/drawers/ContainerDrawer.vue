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
        <li v-for="item in items" :key="item.id" class="item">
          <EntityCard :entity="item" :label="itemLabel(item)" />
        </li>
      </ul>
    </template>
  </Drawer>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
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
    const base = item.name ? `${item.name} (${item.type})` : item.type
    const count = item.traits.stackable?.count ?? 1
    return count > 1 ? `${base} \u00d7 ${count}` : base
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
</style>
