import { onScopeDispose, readonly, shallowRef } from 'vue'

export interface Toast {
  id: number
  text: string
  /** Visual variant — drives accent color in `ToastOverlay.vue`. */
  kind: 'pickup' | 'info'
}

/** App-wide toast queue. Module-scoped so all callers share one stream
 *  regardless of which component pushes. */
const list = shallowRef<Toast[]>([])
let nextId = 1
const DEFAULT_DURATION_MS = 2400

/** Composable for emitting transient toasts and reading the current queue.
 *  Pending dismissal timers are tied to the calling scope (component setup
 *  or Pinia store), so they're cancelled on scope disposal — preventing
 *  late writes to a unmounted/recreated state.
 *
 *  The visible queue itself is shared (singleton) — only the *timers*
 *  belong to the caller. */
export function useToasts() {
  const timers = new Set<ReturnType<typeof setTimeout>>()

  function push(text: string, kind: Toast['kind'] = 'info', durationMs = DEFAULT_DURATION_MS) {
    const id = nextId++
    list.value = [...list.value, { id, text, kind }]
    const handle = setTimeout(() => {
      timers.delete(handle)
      list.value = list.value.filter(t => t.id !== id)
    }, durationMs)
    timers.add(handle)
    return id
  }

  function clear() {
    for (const h of timers) clearTimeout(h)
    timers.clear()
    list.value = []
  }

  onScopeDispose(() => {
    for (const h of timers) clearTimeout(h)
    timers.clear()
  })

  return {
    toasts: readonly(list),
    push,
    clear,
  }
}
