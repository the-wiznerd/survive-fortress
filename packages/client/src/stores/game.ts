import { defineStore } from 'pinia'
import { ref, shallowRef, watch } from 'vue'
import type { Game, GameView, InspectResult, PlayerAction, TurnMode } from '@repo/server/sdk'
import { connect } from '~client/utils/net/connection'
import { playFrames, type PlaybackHandle } from '~client/utils/net/playback'

const DEFAULT_SAVE = 'test-world'
const SAVE_NAME = new URLSearchParams(window.location.search).get('save') ?? DEFAULT_SAVE

const TURN_MODE_STORAGE_KEY = 'survive-fortress-turn-mode'
const SCALE_STORAGE_KEY = 'survive-fortress-scale'

function loadTurnMode(): TurnMode {
  try {
    const raw = localStorage.getItem(TURN_MODE_STORAGE_KEY)
    if (raw === 'manual' || raw === 'auto') return raw
  } catch { /* ignore */ }
  return 'auto'
}

function loadScale(): number {
  try {
    const raw = localStorage.getItem(SCALE_STORAGE_KEY)
    const n = raw ? parseInt(raw, 10) : NaN
    if (Number.isFinite(n) && n >= 1) return n
  } catch { /* ignore */ }
  return 3
}

/** The single application store: round phase, plan management, and the current view.
 *  Uses Pinia's setup-style for natural ref/shallowRef composition.
 *
 *  `view` is a `shallowRef` because GameView is a large per-frame snapshot
 *  replaced wholesale; deep reactivity would be wasted work. */
export const useGameStore = defineStore('game', () => {
  // ─── State ───
  const phase = ref<RoundPhase>('planning')
  /** The plan currently being assembled by the player. */
  const plan = ref<PlayerAction[]>([])
  /** The plan most recently submitted to the server. Frozen during submitted/resolving,
   *  cleared when a new planning phase begins. */
  const submittedPlan = ref<PlayerAction[]>([])
  /** Per-frame plan progress emitted during playback. */
  const planProgress = ref<PlanProgress>({ index: 0, terminated: false })
  const view = shallowRef<GameView | null>(null)
  /** How rounds advance: `manual` requires explicit submit, `auto` ticks freely. Persisted. */
  const turnMode = ref<TurnMode>(loadTurnMode())
  watch(turnMode, (mode) => { localStorage.setItem(TURN_MODE_STORAGE_KEY, mode) })
  /** Renderer pixel scale multiplier. Persisted. */
  const scale = ref<number>(loadScale())
  watch(scale, (n) => { localStorage.setItem(SCALE_STORAGE_KEY, String(n)) })
  /** The world cell currently selected for inspection (clicked on the canvas). */
  const inspectedCell = ref<CellCoord | null>(null)
  /** Cached inspect result for `inspectedCell`. Refreshed on selection change and on phase change. */
  const inspectResult = ref<InspectResult | null>(null)

  // ─── Non-reactive backing state ───
  // These are not reactive on purpose; they're transport/lifecycle handles, not UI state.
  let game: Game | null = null
  let playback: PlaybackHandle | null = null
  let maxPlanActions = 8
  let onCameraMove: ((x: number, y: number, z: number) => void) | null = null

  // ─── Lifecycle ───

  /** Connect to the server and prepare for the first round.
   *  `cameraCallback` is invoked whenever the camera should follow the player. */
  async function init(cameraCallback: (x: number, y: number, z: number) => void) {
    stop()
    onCameraMove = cameraCallback
    game = await connect(SAVE_NAME, turnMode.value)
    maxPlanActions = game.actionsPerRound

    const initialView = game.getView()
    view.value = initialView
    centerOnPlayer(initialView)

    game.onRoundResolve((frames) => {
      startPlayback(frames)
    })

    phase.value = 'planning'
  }

  function stop() {
    playback?.cancel()
    playback = null
    if (game) {
      game.stop()
      game = null
    }
  }

  /** Switch turn mode and reconnect. Requires `init()` to have been called previously
   *  so we have a camera callback to reuse. */
  async function setTurnMode(mode: TurnMode) {
    if (mode === turnMode.value) return
    turnMode.value = mode
    if (onCameraMove) await init(onCameraMove)
  }

  /** Reconnect to the server using the existing camera callback. No-op until `init()`. */
  async function reload() {
    if (onCameraMove) await init(onCameraMove)
  }

  function setScale(n: number) {
    scale.value = Math.max(1, Math.floor(n))
  }

  function setInspectedCell(cell: CellCoord | null) {
    inspectedCell.value = cell
    refreshInspector()
  }

  function refreshInspector() {
    const cell = inspectedCell.value
    inspectResult.value = cell && game ? game.inspect(cell.x, cell.y) : null
  }

  // Re-inspect whenever the round phase changes (so harvested/moved entities update).
  watch(phase, refreshInspector)

  function getGame(): Game {
    if (!game) throw new Error('Game not initialized')
    return game
  }

  /** Read-only snapshot of `actionsPerRound` for components that need it. */
  function actionsPerRound(): number { return maxPlanActions }

  // ─── Plan Management ───

  function appendMove(dx: number, dy: number) {
    if (phase.value !== 'planning') return
    if (plan.value.length >= maxPlanActions) return
    plan.value.push({ type: 'move', dx, dy })
  }

  function appendHarvest(targetId: number) {
    if (phase.value !== 'planning') return
    if (plan.value.length >= maxPlanActions) return
    if (plan.value.some(a => a.type === 'harvest' && a.targetId === targetId)) return
    plan.value.push({ type: 'harvest', targetId })
  }

  function appendPickup(targetId: number) {
    if (phase.value !== 'planning') return
    if (plan.value.length >= maxPlanActions) return
    if (plan.value.some(a => a.type === 'pickup' && a.targetId === targetId)) return
    plan.value.push({ type: 'pickup', targetId })
  }

  function appendDrop(targetId: number, dx = 0, dy = 0) {
    if (phase.value !== 'planning') return
    if (plan.value.length >= maxPlanActions) return
    if (plan.value.some(a => a.type === 'drop' && a.targetId === targetId)) return
    plan.value.push({ type: 'drop', targetId, dx, dy })
  }

  function appendEat(targetId: number) {
    if (phase.value !== 'planning') return
    if (plan.value.length >= maxPlanActions) return
    if (plan.value.some(a => a.type === 'eat' && a.targetId === targetId)) return
    plan.value.push({ type: 'eat', targetId })
  }

  function clearPlan() {
    if (phase.value !== 'planning') return
    plan.value = []
  }

  function submitPlan() {
    if (phase.value !== 'planning') return
    if (!game) return
    const actions = plan.value.slice(0, maxPlanActions)
    game.submitPlan(actions)
    submittedPlan.value = actions.map(a => ({ ...a }))
    planProgress.value = { index: 0, terminated: false }
    plan.value = []
    phase.value = 'submitted'
  }

  /** Returns the world position the player will be at after all planned moves. */
  function planCursor(): CellCoord | null {
    const v = view.value
    if (!v) return null
    const player = v.entities.find(e => String(e.id) === v.playerId)
    if (!player) return null
    let x = player.x
    let y = player.y
    for (const action of plan.value) {
      if (action.type === 'move') { x += action.dx; y += action.dy }
    }
    return { x, y }
  }

  // ─── Playback ───

  function startPlayback(frames: GameView[]) {
    playback?.cancel()
    phase.value = 'resolving'
    playback = playFrames(frames, {
      onFrame(frame) {
        view.value = frame
        planProgress.value = {
          index: frame.playerPlan.index,
          terminated: frame.playerPlan.terminated,
        }
        centerOnPlayer(frame)
      },
      onDone() {
        playback = null
        submittedPlan.value = []
        planProgress.value = { index: 0, terminated: false }
        phase.value = 'planning'
      },
    })
  }

  function centerOnPlayer(v: GameView) {
    const player = v.entities.find(e => String(e.id) === v.playerId)
    if (player && onCameraMove) onCameraMove(player.x, player.y, player.z)
  }

  return {
    // state
    phase,
    plan,
    submittedPlan,
    planProgress,
    view,
    turnMode,
    scale,
    inspectedCell,
    inspectResult,
    // lifecycle
    init,
    stop,
    reload,
    setTurnMode,
    setScale,
    setInspectedCell,
    getGame,
    actionsPerRound,
    // plan actions
    appendMove,
    appendHarvest,
    appendPickup,
    appendDrop,
    appendEat,
    clearPlan,
    submitPlan,
    planCursor,
  }
})
