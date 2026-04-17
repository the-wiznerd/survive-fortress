import { createLocalGame, type Game, type GameView } from '@repo/server/sdk'
import { setOnQueueChange, advanceQueue, type MoveStep } from './input'

// ─── Game State ───

let game: Game
let currentView: GameView
let lastPlayerX: number | undefined
let lastPlayerY: number | undefined

const DEFAULT_SAVE = 'test-world'
const SAVE_NAME = new URLSearchParams(window.location.search).get('save') ?? DEFAULT_SAVE
const SAVE_PATH = `/saves/${SAVE_NAME}`

export function getGame(): Game { return game }
export function getView(): GameView { return currentView }

export async function init(renderer: Renderer) {
  game = await createLocalGame(async () => {
    const manifestResp = await fetch(`${SAVE_PATH}/world.json`)
    const manifest = await manifestResp.json()

    const chunks: unknown[] = []
    for (const ref of Object.values(manifest.chunks)) {
      const chunkResp = await fetch(`${SAVE_PATH}/chunks/${(ref as any).cx}_${(ref as any).cy}.json`)
      chunks.push(await chunkResp.json())
    }

    return { manifest, chunks }
  })

  currentView = game.getView()

  // Center camera on player.
  const player = currentView.entities.find(e => String(e.id) === currentView.playerId)
  if (player) {
    renderer.setCamera(player.x, player.y)
    lastPlayerX = player.x
    lastPlayerY = player.y
  }

  // Wire queue changes to game actions.
  setOnQueueChange((front: MoveStep | null) => {
    if (front) {
      game.sendAction({ type: 'move', dx: front.dx, dy: front.dy })
    } else {
      game.sendAction({ type: 'wait' })
    }
  })
}

export function startTickLoop(renderer: Renderer, onTick: () => void) {
  game.onViewUpdate((view) => {
    currentView = view
    const player = view.entities.find(e => String(e.id) === view.playerId)
    if (player) {
      renderer.setCamera(player.x, player.y)

      // Detect player movement → advance queue.
      if (lastPlayerX !== undefined && lastPlayerY !== undefined) {
        if (player.x !== lastPlayerX || player.y !== lastPlayerY) {
          advanceQueue()
        }
      }
      lastPlayerX = player.x
      lastPlayerY = player.y
    }
    onTick()
  })

  game.start()
  //
}
