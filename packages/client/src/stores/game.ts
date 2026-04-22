import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { Game, GameView, PlayerAction, TurnMode } from '@repo/server/sdk'
import { connect } from '~client/utils/net/connection'
import { playFrames, type PlaybackHandle } from '~client/utils/net/playback'

const DEFAULT_SAVE = 'test-world'
const SAVE_NAME = new URLSearchParams(window.location.search).get('save') ?? DEFAULT_SAVE

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

  // ─── Non-reactive backing state ───
  // These are not reactive on purpose; they're transport/lifecycle handles, not UI state.
  let game: Game | null = null
  let playback: PlaybackHandle | null = null
  let maxPlanActions = 8
  let onCameraMove: ((x: number, y: number, z: number) => void) | null = null

  // ─── Lifecycle ───

  /** Connect to the server and prepare for the first round.
   *  `cameraCallback` is invoked whenever the camera should follow the player. */
  async function init(turnMode: TurnMode, cameraCallback: (x: number, y: number, z: number) => void) {
    stop()
    onCameraMove = cameraCallback
    game = await connect(SAVE_NAME, turnMode)
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
    // lifecycle
    init,
    stop,
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
