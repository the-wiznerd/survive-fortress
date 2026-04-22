import { ref, readonly, computed } from 'vue'

/** Discriminated union of all view kinds that can appear in the sidebar stack.
 *  Add new variants here as new drawer types are introduced. */
export type SidebarView =
  | { kind: 'inspector' }
  | { kind: 'bag' }

/** Stack entries carry a stable id so Vue can preserve component instance state
 *  (scroll position, disclosure open/closed, etc.) across pushes/pops. */
export interface SidebarStackEntry {
  id: number
  view: SidebarView
}

let nextId = 1
const stack = ref<SidebarStackEntry[]>([{ id: 0, view: { kind: 'inspector' } }])
/** Direction of the most recent navigation; drives slide animation in `Sidebar.vue`. */
const direction = ref<'push' | 'pop'>('push')

export const sidebarStack = readonly(stack)
export const sidebarDirection = readonly(direction)
export const sidebarTop = computed(() => stack.value[stack.value.length - 1]?.view)
export const sidebarDepth = computed(() => stack.value.length)

export function pushSidebarView(view: SidebarView) {
  direction.value = 'push'
  stack.value.push({ id: nextId++, view })
}

export function popSidebarView() {
  if (stack.value.length <= 1) return
  direction.value = 'pop'
  stack.value.pop()
}

export function resetSidebarStack() {
  direction.value = 'pop'
  stack.value = [{ id: 0, view: { kind: 'inspector' } }]
  nextId = 1
}
