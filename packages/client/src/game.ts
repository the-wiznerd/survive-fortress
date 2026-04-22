import { reactive, shallowRef } from 'vue'
import type { Game, GameView, ServerMessage, SerializedGameView, PlayerAction, TurnMode } from '@repo/server/sdk'
import { Renderer } from '~client/renderer'

// ─── Types ───

export type RoundPhase = 'planning' | 'submitted' | 'resolving'

export interface PlanProgress {
  /** Number of actions completed successfully so far. */
  index: number
  /** True if the plan was terminated by an invalid action this round. */
  terminated: boolean
}

// ─── Reactive State ───
//
// Components import `gameState` and read fields directly — Vue tracks dependencies
// via the reactive proxy, so no manual subscribe/unsubscribe is needed.
// `view` is kept as a separate shallowRef because GameView is a large per-frame
// snapshot that is replaced wholesale; deep reactivity would be wasted work.

export const gameState = reactive({
  phase: 'planning' as RoundPhase,
  /** The plan currently being assembled by the player. */
  plan: [] as PlayerAction[],
  /** The plan most recently submitted to the server. Frozen during submitted/resolving,
   *  cleared when a new planning phase begins. */
  submittedPlan: [] as PlayerAction[],
  /** Per-frame plan progress emitted during playback. */
  planProgress: { index: 0, terminated: false } as PlanProgress,
})

export const view = shallowRef<GameView | null>(null)

// ─── Game Connection ───

let game: Game
let gameInitialized = false
let resolveTimerId: ReturnType<typeof setTimeout> | null = null
let maxPlanActions = 8

const PLAYBACK_TICK_MS = 250

const WS_URL = 'ws://localhost:5174'
const DEFAULT_SAVE = 'test-world'
const SAVE_NAME = new URLSearchParams(window.location.search).get('save') ?? DEFAULT_SAVE

export function getGame(): Game { return game }

export function stopGame() {
  if (resolveTimerId) {
    clearTimeout(resolveTimerId)
    resolveTimerId = null
  }
  if (!gameInitialized) return
  game.stop()
  gameInitialized = false
}

function deserializeView(sv: SerializedGameView): GameView {
  return { ...sv, visiblePositions: new Set(sv.visiblePositions) }
}

// ─── Plan Management ───

/** Returns the world position the player will be at after all planned moves. */
export function getPlanCursor(): { x: number; y: number } | null {
  const v = view.value
  if (!v) return null
  const player = v.entities.find(e => String(e.id) === v.playerId)
  if (!player) return null
  let x = player.x
  let y = player.y
  for (const action of gameState.plan) {
    if (action.type === 'move') { x += action.dx; y += action.dy }
  }
  return { x, y }
}

export function appendMove(dx: number, dy: number) {
  if (gameState.phase !== 'planning') return
  if (gameState.plan.length >= maxPlanActions) return
  gameState.plan.push({ type: 'move', dx, dy })
}

export function appendHarvest(targetId: number) {
  if (gameState.phase !== 'planning') return
  if (gameState.plan.length >= maxPlanActions) return
  if (gameState.plan.some(a => a.type === 'harvest' && a.targetId === targetId)) return
  gameState.plan.push({ type: 'harvest', targetId })
}

export function appendPickup(targetId: number) {
  if (gameState.phase !== 'planning') return
  if (gameState.plan.length >= maxPlanActions) return
  if (gameState.plan.some(a => a.type === 'pickup' && a.targetId === targetId)) return
  gameState.plan.push({ type: 'pickup', targetId })
}

export function appendDrop(targetId: number, dx = 0, dy = 0) {
  if (gameState.phase !== 'planning') return
  if (gameState.plan.length >= maxPlanActions) return
  if (gameState.plan.some(a => a.type === 'drop' && a.targetId === targetId)) return
  gameState.plan.push({ type: 'drop', targetId, dx, dy })
}

export function appendEat(targetId: number) {
  if (gameState.phase !== 'planning') return
  if (gameState.plan.length >= maxPlanActions) return
  if (gameState.plan.some(a => a.type === 'eat' && a.targetId === targetId)) return
  gameState.plan.push({ type: 'eat', targetId })
}

export function clearPlan() {
  if (gameState.phase !== 'planning') return
  gameState.plan = []
}

export function submitPlan() {
  if (gameState.phase !== 'planning') return
  if (!gameInitialized) return
  const actions = gameState.plan.slice(0, maxPlanActions)
  game.submitPlan(actions)
  gameState.submittedPlan = actions.map(a => ({ ...a }))
  gameState.planProgress = { index: 0, terminated: false }
  gameState.plan = []
  gameState.phase = 'submitted'
}

// ─── Connection ───

function connectGame(save: string, turnMode: TurnMode): Promise<Game> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL)

    let resolveCallback: ((frames: GameView[]) => void) | null = null
    let latestView: GameView | null = null
    let actionsPerRound = 8
    let serverTurnMode: TurnMode = turnMode

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', save, turnMode }))
    }

    ws.onerror = () => {
      reject(new Error('WebSocket connection failed'))
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ServerMessage

      switch (msg.type) {
        case 'joined':
          latestView = deserializeView(msg.view)
          actionsPerRound = msg.actionsPerRound
          serverTurnMode = msg.turnMode
          resolve({
            onRoundResolve(cb) { resolveCallback = cb },
            submitPlan(actions) { ws.send(JSON.stringify({ type: 'submit-plan', actions })) },
            inspect(x, y) {
              const v = latestView!
              return { entities: v.entities.filter(e => e.x === x && e.y === y) }
            },
            stop() { ws.close() },
            getView() { return latestView! },
            get actionsPerRound() { return actionsPerRound },
            get turnMode() { return serverTurnMode },
            sendRaw(msg) { ws.send(JSON.stringify(msg)) },
          })
          break

        case 'round-resolve': {
          const frames = msg.frames.map(deserializeView)
          if (frames.length > 0) {
            latestView = frames[frames.length - 1]!
          }
          resolveCallback?.(frames)
          break
        }

        case 'error':
          console.error('Server error:', msg.message)
          break
      }
    }
  })
}

// ─── Playback ───

function startPlayback(frames: GameView[], renderer: Renderer, onDone: () => void) {
  if (resolveTimerId) {
    clearTimeout(resolveTimerId)
    resolveTimerId = null
  }

  if (frames.length === 0) {
    onDone()
    return
  }

  gameState.phase = 'resolving'
  let frameIndex = 0

  function step() {
    const frame = frames[frameIndex]
    if (!frame) {
      resolveTimerId = null
      onDone()
      return
    }

    view.value = frame
    gameState.planProgress = {
      index: frame.playerPlan.index,
      terminated: frame.playerPlan.terminated,
    }
    const player = frame.entities.find(e => String(e.id) === frame.playerId)
    if (player) renderer.setCamera(player.x, player.y, player.z)

    frameIndex++
    if (frameIndex < frames.length) {
      resolveTimerId = setTimeout(step, PLAYBACK_TICK_MS)
    } else {
      resolveTimerId = null
      onDone()
    }
  }

  step()
}

// ─── Init ───

export async function init(renderer: Renderer, onUpdate: () => void, turnMode: TurnMode) {
  stopGame()
  game = await connectGame(SAVE_NAME, turnMode)
  gameInitialized = true
  maxPlanActions = game.actionsPerRound

  const initialView = game.getView()
  view.value = initialView

  // Center camera on player.
  const player = initialView.entities.find(e => String(e.id) === initialView.playerId)
  if (player) {
    renderer.setCamera(player.x, player.y, player.z)
  }

  game.onRoundResolve((frames) => {
    startPlayback(frames, renderer, () => {
      gameState.submittedPlan = []
      gameState.planProgress = { index: 0, terminated: false }
      gameState.phase = 'planning'
      onUpdate()
    })
  })

  gameState.phase = 'planning'
  onUpdate()
}
