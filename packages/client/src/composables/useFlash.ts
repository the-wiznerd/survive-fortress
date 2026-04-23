import { computed, onScopeDispose, shallowRef, type ComputedRef } from 'vue'
import type { EntityId } from '@repo/server/sdk'

/** Map of entityId → tick-count generation when the flash should expire.
 *  Generation numbers let us detect "another flash superseded mine" so a
 *  later timer doesn't accidentally clear a fresher highlight. */
const flashes = shallowRef<Map<EntityId, number>>(new Map())
let generation = 0
const DEFAULT_DURATION_MS = 1200

/** Composable for triggering and observing entity flash highlights.
 *  Flash state is shared globally (one map for the whole UI) but pending
 *  expiration timers are tied to the calling scope so they don't leak. */
export function useFlash() {
  const timers = new Set<ReturnType<typeof setTimeout>>()

  function flash(id: EntityId, durationMs = DEFAULT_DURATION_MS) {
    const gen = ++generation
    const next = new Map(flashes.value)
    next.set(id, gen)
    flashes.value = next

    const handle = setTimeout(() => {
      timers.delete(handle)
      // Only clear if our generation is still the active one — a later flash
      // may have re-set this id with a fresh generation we shouldn't kill.
      if (flashes.value.get(id) !== gen) return
      const m = new Map(flashes.value)
      m.delete(id)
      flashes.value = m
    }, durationMs)
    timers.add(handle)
  }

  onScopeDispose(() => {
    for (const h of timers) clearTimeout(h)
    timers.clear()
  })

  return { flash, useEntityFlash }
}

/** Reactive boolean for whether the given entity id is currently flashing.
 *  Pass a getter so the consumer can flash a moving target (e.g. a v-for item).
 *  Exported standalone so observe-only consumers (cards, badges) don't need to
 *  instantiate the controller composable. */
export function useEntityFlash(id: () => EntityId): ComputedRef<boolean> {
  return computed(() => flashes.value.has(id()))
}
