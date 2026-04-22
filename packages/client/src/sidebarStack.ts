import { ref, readonly, computed } from 'vue'

/** Discriminated union of all view kinds that can appear in the sidebar stack.
 *  Add new variants here as new drawer types are introduced. */
export type SidebarView =
  | { kind: 'inspector' }
  | { kind: 'bag' }

const stack = ref<SidebarView[]>([{ kind: 'inspector' }])
/** Direction of the most recent navigation; drives slide animation in `Sidebar.vue`. */
const direction = ref<'push' | 'pop'>('push')

export const sidebarStack = readonly(stack)
export const sidebarDirection = readonly(direction)
export const sidebarTop = computed(() => stack.value[stack.value.length - 1])
export const sidebarDepth = computed(() => stack.value.length)

export function pushSidebarView(view: SidebarView) {
  direction.value = 'push'
  stack.value.push(view)
}

export function popSidebarView() {
  if (stack.value.length <= 1) return
  direction.value = 'pop'
  stack.value.pop()
}

export function resetSidebarStack() {
  direction.value = 'pop'
  stack.value = [{ kind: 'inspector' }]
}
