import { defineStore } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'
import type { ActionCosts, Direction, Game, GameView, InspectResult, PlayerAction, TurnMode } from '@repo/server/sdk'
import { DIRECTION_DELTAS } from '@repo/server/sdk'
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
  /** Names of action targets at the moment of submission, so the PlanFeed can
   *  still show "Eat Berry" after the entity has been destroyed mid-resolution. */
  const submittedTargetLabels = ref<Map<number, string>>(new Map())
  /** Per-frame plan progress emitted during playback. */
  const planProgress = ref<PlanProgress>({ index: 0, terminated: false, elapsedTicks: 0 })
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
  /** Player's per-round AP budget. Set on connect from the `joined` message. */
  const actionPointsPerRound = ref<number>(8)
  /** AP cost per action type. Set on connect from the `joined` message. */
  const actionCosts = ref<ActionCosts>({ move: 1, wait: 1, harvest: 1, pickup: 1, drop: 1, eat: 1 })
  /** Resolve the AP cost of a concrete action, including per-target costs (e.g. harvest). */
  function actionCost(action: PlayerAction): number {
    if (action.type === 'harvest') {
      const target = view.value?.entities.find(e => e.id === action.targetId)
      const h = target?.traits.harvestable as { cost?: number } | undefined
      return h?.cost ?? actionCosts.value.harvest ?? 1
    }
    return actionCosts.value[action.type] ?? 1
  }
  /** Total AP cost of the currently planned actions. */
  const planCost = computed(() =>
    plan.value.reduce((sum, a) => sum + actionCost(a), 0)
  )

  // ─── Non-reactive backing state ───
  // These are not reactive on purpose; they're transport/lifecycle handles, not UI state.
  let game: Game | null = null
  let playback: PlaybackHandle | null = null
  let onCameraMove: ((x: number, y: number, z: number) => void) | null = null

  // ─── Lifecycle ───

  /** Connect to the server and prepare for the first round.
   *  `cameraCallback` is invoked whenever the camera should follow the player. */
  async function init(cameraCallback: (x: number, y: number, z: number) => void) {
    stop()
    onCameraMove = cameraCallback
    game = await connect(SAVE_NAME, turnMode.value)
    actionPointsPerRound.value = game.actionPointsPerRound
    actionCosts.value = game.actionCosts

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

  /** Whether appending `action` would fit in the AP budget. */
  function canAfford(action: PlayerAction): boolean {
    return planCost.value + actionCost(action) <= actionPointsPerRound.value
  }

  // ─── Plan Management ───

  function appendMove(direction: Direction) {
    if (phase.value !== 'planning') return
    const action: PlayerAction = { type: 'move', direction }
    if (!canAfford(action)) return
    plan.value.push(action)
  }

  /** Returns the world position the player will be at after all currently-planned moves. */
  function planCursor(): CellCoord | null {
    const v = view.value
    if (!v) return null
    const player = v.entities.find(e => String(e.id) === v.playerId)
    if (!player) return null
    let x = player.x
    let y = player.y
    for (const action of plan.value) {
      if (action.type === 'move') {
        const { dx, dy } = DIRECTION_DELTAS[action.direction]
        x += dx
        y += dy
      }
    }
    return { x, y }
  }

  /** Append a path of single-tile cardinal moves from the current plan cursor
   *  to (tx, ty). Each step is one of N/S/E/W only — diagonals are emitted as
   *  two separate moves. The walk interleaves x- and y-steps so the path
   *  stays close to the straight line between start and target. Truncates
   *  silently when the AP budget is reached. No collision checks — the engine
   *  validates each step at execution time. */
  function appendPathTo(tx: number, ty: number) {
    if (phase.value !== 'planning') return
    const start = planCursor()
    if (!start) return
    let remX = Math.abs(tx - start.x)
    let remY = Math.abs(ty - start.y)
    const sx = Math.sign(tx - start.x)
    const sy = Math.sign(ty - start.y)
    // Interleave x and y steps so the path stays close to a straight line.
    // At each step, pick whichever axis has more remaining distance (favors x
    // on ties). Each emitted action moves exactly one tile cardinally.
    while (remX > 0 || remY > 0) {
      const stepX = remX >= remY && remX > 0
      const direction: Direction = stepX
        ? (sx > 0 ? 'e' : 'w')
        : (sy > 0 ? 's' : 'n')
      const action: PlayerAction = { type: 'move', direction }
      if (!canAfford(action)) return
      plan.value.push(action)
      if (stepX) remX--
      else remY--
    }
  }

  function appendHarvest(targetId: number) {
    if (phase.value !== 'planning') return
    const action: PlayerAction = { type: 'harvest', targetId }
    if (!canAfford(action)) return
    if (plan.value.some(a => a.type === 'harvest' && a.targetId === targetId)) return
    plan.value.push(action)
  }

  function appendPickup(targetId: number) {
    if (phase.value !== 'planning') return
    const action: PlayerAction = { type: 'pickup', targetId }
    if (!canAfford(action)) return
    if (plan.value.some(a => a.type === 'pickup' && a.targetId === targetId)) return
    plan.value.push(action)
  }

  function appendDrop(targetId: number, dx = 0, dy = 0) {
    if (phase.value !== 'planning') return
    const action: PlayerAction = { type: 'drop', targetId, dx, dy }
    if (!canAfford(action)) return
    if (plan.value.some(a => a.type === 'drop' && a.targetId === targetId)) return
    plan.value.push(action)
  }

  function appendEat(targetId: number) {
    if (phase.value !== 'planning') return
    const action: PlayerAction = { type: 'eat', targetId }
    if (!canAfford(action)) return
    // Stacks (e.g. berries) can be eaten multiple times per turn, up to count.
    const target = view.value?.entities.find(e => e.id === targetId)
    const stackCount = target?.traits.stackable?.count ?? 1
    const alreadyQueued = plan.value.filter(
      a => a.type === 'eat' && a.targetId === targetId,
    ).length
    if (alreadyQueued >= stackCount) return
    plan.value.push(action)
  }

  function clearPlan() {
    if (phase.value !== 'planning') return
    plan.value = []
  }

  /** Remove the first action in the plan matching the given target action.
   *  For target-bearing actions (harvest/pickup/eat/drop) this matches by
   *  type + targetId. For move/wait this is a no-op — those don't have a
   *  stable identity to match against. */
  function removeFromPlan(action: PlayerAction) {
    if (phase.value !== 'planning') return
    const idx = plan.value.findIndex(p => {
      if (p.type !== action.type) return false
      if ('targetId' in action && 'targetId' in p) {
        return p.targetId === action.targetId
      }
      return false
    })
    if (idx >= 0) plan.value.splice(idx, 1)
  }

  function submitPlan() {
    if (phase.value !== 'planning') return
    if (!game) return
    const actions = plan.value.slice()
    game.submitPlan(actions)
    submittedPlan.value = actions.map(a => ({ ...a }))
    // Snapshot target labels for actions that reference an entity, so the
    // PlanFeed remains readable even after targets are destroyed.
    const labels = new Map<number, string>()
    const v = view.value
    if (v) {
      for (const a of actions) {
        if (!('targetId' in a)) continue
        const e = v.entities.find(x => x.id === a.targetId)
        if (e) labels.set(a.targetId, e.name ?? e.type)
      }
    }
    submittedTargetLabels.value = labels
    planProgress.value = { index: 0, terminated: false, elapsedTicks: 0 }
    plan.value = []
    phase.value = 'submitted'
  }

  // ─── Playback ───

  function startPlayback(frames: GameView[]) {
    playback?.cancel()
    phase.value = 'resolving'
    let elapsedTicks = 0
    playback = playFrames(frames, {
      onFrame(frame) {
        view.value = frame
        elapsedTicks++
        planProgress.value = {
          index: frame.playerPlan.index,
          terminated: frame.playerPlan.terminated,
          elapsedTicks,
        }
        centerOnPlayer(frame)
      },
      onDone() {
        playback = null
        submittedPlan.value = []
        submittedTargetLabels.value = new Map()
        planProgress.value = { index: 0, terminated: false, elapsedTicks: 0 }
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
    submittedTargetLabels,
    planProgress,
    view,
    turnMode,
    scale,
    inspectedCell,
    inspectResult,
    actionPointsPerRound,
    actionCosts,
    actionCost,
    planCost,
    // lifecycle
    init,
    stop,
    reload,
    setTurnMode,
    setScale,
    setInspectedCell,
    getGame,
    canAfford,
    // plan actions
    appendMove,
    appendPathTo,
    appendHarvest,
    appendPickup,
    appendDrop,
    appendEat,
    clearPlan,
    removeFromPlan,
    submitPlan,
    planCursor,
  }
})
