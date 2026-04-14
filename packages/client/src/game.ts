import { createLocalGame, type Game, type GameView } from '@sf/server/sdk'
import { Renderer } from './renderer.js'

// ─── Game State ───

let game: Game
let currentView: GameView

const SAVE_PATH = '/saves/test-world'

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
  if (player) renderer.setCamera(player.x, player.y)
}

export function startTickLoop(renderer: Renderer, getInput: () => { type: string; dx?: number; dy?: number } | null, onTick: () => void) {
  game.onViewUpdate((view) => {
    currentView = view
    const player = view.entities.find(e => String(e.id) === view.playerId)
    if (player) renderer.setCamera(player.x, player.y)
    onTick()
  })

  game.start()

  // Feed input each frame — the game SDK will pick it up on next tick.
  setInterval(() => {
    const input = getInput()
    if (input) {
      game.sendAction(input as any)
    }
  }, 50)
}
