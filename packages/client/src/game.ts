import type { Game, GameView, ServerMessage, SerializedGameView } from '@repo/server/sdk'
import { setOnQueueChange, advanceQueue, clearQueue, type MoveStep } from '~client/input'
import { Renderer } from '~client/renderer'

// ─── Game State ───

let game: Game
let currentView: GameView
let nextActionId = 0
let latestActionId: string | null = null

const WS_URL = 'ws://localhost:5174'
const DEFAULT_SAVE = 'test-world'
const SAVE_NAME = new URLSearchParams(window.location.search).get('save') ?? DEFAULT_SAVE

export function getGame(): Game { return game }
export function getView(): GameView { return currentView }

function deserializeView(sv: SerializedGameView): GameView {
  return { ...sv, visiblePositions: new Set(sv.visiblePositions) }
}

function connectGame(save: string): Promise<Game> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL)

    let viewCallback: ((view: GameView) => void) | null = null
    let actionResultCallback: ((actionId: string, result: 'accepted' | 'rejected') => void) | null = null
    let initialView: GameView | null = null

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
          initialView = deserializeView(msg.view)
          resolve({
            onViewUpdate(cb) { viewCallback = cb },
            onActionResult(cb) { actionResultCallback = cb },
            sendAction(actionId, action) { ws.send(JSON.stringify({ type: 'action', actionId, action })) },
            inspect(x, y) {
              const view = initialView!
              return { entities: view.entities.filter(e => e.x === x && e.y === y) }
            },
            start() { /* tick loop runs on the server */ },
            stop() { ws.close() },
            getView() { return initialView! },
          })
          break

        case 'view': {
          const view = deserializeView(msg.view)
          initialView = view
          viewCallback?.(view)
          break
        }

        case 'action-result':
          actionResultCallback?.(msg.actionId, msg.result)
          break

        case 'error':
          console.error('Server error:', msg.message)
          break
      }
    }
  })
}

function sendNextAction(front: MoveStep | null) {
  const actionId = String(++nextActionId)
  latestActionId = actionId
  if (front) {
    game.sendAction(actionId, { type: 'move', dx: front.dx, dy: front.dy })
  } else {
    game.sendAction(actionId, { type: 'wait' })
  }
}

export async function init(renderer: Renderer) {
  game = await connectGame(SAVE_NAME)

  currentView = game.getView()

  // Center camera on player.
  const player = currentView.entities.find(e => String(e.id) === currentView.playerId)
  if (player) {
    renderer.setCamera(player.x, player.y)
  }

  // Wire queue changes to game actions.
  setOnQueueChange((front: MoveStep | null) => {
    sendNextAction(front)
  })
}

export function startTickLoop(renderer: Renderer, onTick: () => void) {
  game.onViewUpdate((view) => {
    currentView = view
    const player = view.entities.find(e => String(e.id) === view.playerId)
    if (player) {
      renderer.setCamera(player.x, player.y)
    }
    onTick()
  })

  game.onActionResult((actionId, result) => {
    if (actionId !== latestActionId) {
      // Stale result — we've already sent a newer action. Out of sync.
      clearQueue()
      return
    }
    if (result === 'accepted') {
      advanceQueue()
    } else {
      clearQueue()
    }
  })

  game.start()
}
