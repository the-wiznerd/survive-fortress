import { onMounted, onBeforeUnmount } from 'vue'
import { useGameStore } from '~client/stores/game'

/** Bind global keyboard input. WASD builds the plan (move or harvest if a target is adjacent),
 *  Backspace clears, Space submits, R reconnects to the server. */
export function useKeyboardInput() {
  const game = useGameStore()

  function handleDirectional(dx: number, dy: number) {
    const cursor = game.planCursor()
    if (!cursor) { game.appendMove(dx, dy); return }

    const v = game.view
    if (!v) { game.appendMove(dx, dy); return }

    const tx = cursor.x + dx
    const ty = cursor.y + dy

    const target = v.entities.find(e =>
      e.x === tx && e.y === ty &&
      (e.traits.harvestable as { available: boolean } | undefined)?.available === true
    )

    if (target) game.appendHarvest(target.id)
    else game.appendMove(dx, dy)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return

    if (e.key === 'r' || e.key === 'R') { game.reload(); return }

    if (game.phase !== 'planning') return

    let dx = 0, dy = 0
    switch (e.key) {
      case 'w': case 'W': dy = -1; break
      case 's': case 'S': dy = 1; break
      case 'a': case 'A': dx = -1; break
      case 'd': case 'D': dx = 1; break
      case 'Backspace': game.clearPlan(); return
      case ' ': game.submitPlan(); return
      default: return
    }

    e.preventDefault()
    handleDirectional(dx, dy)
  }

  onMounted(() => document.addEventListener('keydown', onKeyDown))
  onBeforeUnmount(() => document.removeEventListener('keydown', onKeyDown))
}
