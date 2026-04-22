import { onMounted, onBeforeUnmount } from 'vue'

/** Run `callback` on every animation frame between the component's mount and unmount.
 *  Cleanup is automatic. */
export function useAnimationFrame(callback: () => void) {
  let handle = 0
  function tick() {
    callback()
    handle = requestAnimationFrame(tick)
  }
  onMounted(() => { handle = requestAnimationFrame(tick) })
  onBeforeUnmount(() => { if (handle) cancelAnimationFrame(handle) })
}
