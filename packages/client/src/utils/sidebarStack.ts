import { ref, readonly, computed } from 'vue'

let nextId = 1
const stack = ref<SidebarStackEntry[]>([{ id: 0, view: { kind: 'player' } }])
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

/** Pop until a view of the given kind is on top (no-op if not found). */
export function popToSidebarView(kind: SidebarView['kind']) {
  const idx = stack.value.findIndex(e => e.view.kind === kind)
  if (idx < 0) return
  if (idx === stack.value.length - 1) return
  direction.value = 'pop'
  stack.value = stack.value.slice(0, idx + 1)
}

export function resetSidebarStack() {
  direction.value = 'pop'
  stack.value = [{ id: 0, view: { kind: 'player' } }]
  nextId = 1
}
