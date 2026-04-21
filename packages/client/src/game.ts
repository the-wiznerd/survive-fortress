import type { Game, GameView, ServerMessage, SerializedGameView, PlayerAction, TurnMode } from '@repo/server/sdk'
import { Renderer } from '~client/renderer'

// ─── Round Phase ───

export type RoundPhase = 'planning' | 'submitted' | 'resolving'

let phase: RoundPhase = 'planning'
let phaseCallback: ((phase: RoundPhase) => void) | null = null

export function getPhase(): RoundPhase { return phase }
export function onPhaseChange(cb: (phase: RoundPhase) => void) { phaseCallback = cb }

function setPhase(p: RoundPhase) {
  phase = p
  phaseCallback?.(p)
}

// ─── Game State ───

let game: Game
let gameInitialized = false
let currentView: GameView
let resolveTimerId: ReturnType<typeof setTimeout> | null = null
let maxPlanActions = 8

const PLAYBACK_TICK_MS = 250

const WS_URL = 'ws://localhost:5174'
const DEFAULT_SAVE = 'test-world'
const SAVE_NAME = new URLSearchParams(window.location.search).get('save') ?? DEFAULT_SAVE

export function getGame(): Game { return game }
export function getView(): GameView { return currentView }

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

let plan: PlayerAction[] = []
let planChangeCallback: ((plan: readonly PlayerAction[]) => void) | null = null

export function getPlan(): readonly PlayerAction[] { return plan }
export function onPlanChange(cb: (plan: readonly PlayerAction[]) => void) { planChangeCallback = cb }

/** Returns the world position the player will be at after all planned moves. */
export function getPlanCursor(): { x: number; y: number } | null {
  if (!currentView) return null
  const player = currentView.entities.find(e => String(e.id) === currentView.playerId)
  if (!player) return null
  let x = player.x
  let y = player.y
  for (const action of plan) {
    if (action.type === 'move') { x += action.dx; y += action.dy }
  }
  return { x, y }
}

export function appendMove(dx: number, dy: number) {
  if (phase !== 'planning') return
  if (plan.length >= maxPlanActions) return
  plan.push({ type: 'move', dx, dy })
  planChangeCallback?.(plan)
}

export function appendHarvest(targetId: number) {
  if (phase !== 'planning') return
  if (plan.length >= maxPlanActions) return
  // No-op if already queued a harvest on this target.
  if (plan.some(a => a.type === 'harvest' && a.targetId === targetId)) return
  plan.push({ type: 'harvest', targetId })
  planChangeCallback?.(plan)
}

export function clearPlan() {
  if (phase !== 'planning') return
  plan = []
  planChangeCallback?.(plan)
}

export function submitPlan() {
  if (phase !== 'planning') return
  if (!gameInitialized) return
  const actions = plan.slice(0, maxPlanActions)
  game.submitPlan(actions)
  plan = []
  planChangeCallback?.(plan)
  setPhase('submitted')
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
              const view = latestView!
              return { entities: view.entities.filter(e => e.x === x && e.y === y) }
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
            latestView = frames[frames.length - 1]
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

  setPhase('resolving')
  let frameIndex = 0

  function step() {
    const frame = frames[frameIndex]
    if (!frame) {
      resolveTimerId = null
      onDone()
      return
    }

    currentView = frame
    const player = currentView.entities.find(e => String(e.id) === currentView.playerId)
    if (player) renderer.setCamera(player.x, player.y)

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

  currentView = game.getView()

  // Center camera on player.
  const player = currentView.entities.find(e => String(e.id) === currentView.playerId)
  if (player) {
    renderer.setCamera(player.x, player.y)
  }

  game.onRoundResolve((frames) => {
    startPlayback(frames, renderer, () => {
      setPhase('planning')
      onUpdate()
    })
  })

  setPhase('planning')
  onUpdate()
}
