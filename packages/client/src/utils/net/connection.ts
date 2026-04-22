// WebSocket transport — pure, no Vue or store imports.
// The store imports `connect()` and treats the returned `Game` as opaque transport.

import type { ActionCosts, ActionType, Game, GameView, ServerMessage, SerializedGameView, TurnMode } from '@repo/server/sdk'

const WS_URL = 'ws://localhost:5174'

function deserializeView(sv: SerializedGameView): GameView {
  return { ...sv, visiblePositions: new Set(sv.visiblePositions) }
}

/** Connect to the server, perform the join handshake, and resolve with a Game handle. */
export function connect(save: string, turnMode: TurnMode): Promise<Game> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL)

    let resolveCallback: ((frames: GameView[]) => void) | null = null
    let latestView: GameView | null = null
    let actionPointsPerRound = 8
    let actionCosts: ActionCosts = { move: 1, wait: 1, harvest: 1, pickup: 1, drop: 1, eat: 1 } satisfies Record<ActionType, number>
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
          actionPointsPerRound = msg.actionPointsPerRound
          actionCosts = msg.actionCosts
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
            get actionPointsPerRound() { return actionPointsPerRound },
            get actionCosts() { return actionCosts },
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
