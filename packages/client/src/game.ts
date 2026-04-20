import type { Game, GameView, ServerMessage, SerializedGameView, PlayerAction } from '@repo/server/sdk'
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
let currentView: GameView
let resolveFrames: GameView[] = []
let resolveIndex = 0
let resolveTimerId: ReturnType<typeof setTimeout> | null = null
let maxPlanActions = 8

const PLAYBACK_TICK_MS = 250

const WS_URL = 'ws://localhost:5174'
const DEFAULT_SAVE = 'test-world'
const SAVE_NAME = new URLSearchParams(window.location.search).get('save') ?? DEFAULT_SAVE

export function getGame(): Game { return game }
export function getView(): GameView { return currentView }

function deserializeView(sv: SerializedGameView): GameView {
  return { ...sv, visiblePositions: new Set(sv.visiblePositions) }
}

// ─── Plan Management ───

let plan: PlayerAction[] = []
let planChangeCallback: ((plan: readonly PlayerAction[]) => void) | null = null

export function getPlan(): readonly PlayerAction[] { return plan }
export function onPlanChange(cb: (plan: readonly PlayerAction[]) => void) { planChangeCallback = cb }

export function appendMove(dx: number, dy: number) {
  if (phase !== 'planning') return
  if (plan.length >= maxPlanActions) return
  plan.push({ type: 'move', dx, dy })
  planChangeCallback?.(plan)
}

export function clearPlan() {
  if (phase !== 'planning') return
  plan = []
  planChangeCallback?.(plan)
}

export function submitPlan() {
  if (phase !== 'planning') return
  const actions = plan.slice(0, maxPlanActions)
  game.submitPlan(actions)
  plan = []
  planChangeCallback?.(plan)
  setPhase('submitted')
}

// ─── Connection ───

function connectGame(save: string): Promise<Game> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL)

    let resolveCallback: ((frames: GameView[]) => void) | null = null
    let latestView: GameView | null = null
    let actionsPerRound = 8

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', save }))
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
            sendRaw(msg) { ws.send(JSON.stringify(msg)) },
          })
          break

        case 'round-resolve': {
          const frames = msg.frames.map(deserializeView)
          latestView = frames[frames.length - 1]
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
  resolveFrames = frames
  resolveIndex = 0
  setPhase('resolving')

  function step() {
    currentView = resolveFrames[resolveIndex]
    const player = currentView.entities.find(e => String(e.id) === currentView.playerId)
    if (player) renderer.setCamera(player.x, player.y)

    resolveIndex++
    if (resolveIndex < resolveFrames.length) {
      resolveTimerId = setTimeout(step, PLAYBACK_TICK_MS)
    } else {
      resolveTimerId = null
      onDone()
    }
  }

  step()
}

// ─── Init ───

export async function init(renderer: Renderer, onUpdate: () => void) {
  game = await connectGame(SAVE_NAME)
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
