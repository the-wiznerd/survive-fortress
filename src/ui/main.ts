import { Renderer } from './renderer.js'
import { init, getWorld, getPlayerId, startTickLoop } from './game.js'
import { bindInput, getPendingInput, getHoveredCell, getInspectedCell } from './input.js'
import { updateUI, updateSelection } from './sidebar.js'
import './components/entity-card.js'
import './components/stat-text.js'

bootstrap()

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const renderer = new Renderer(canvas, 32, 24, 3)

renderer.onReady = () => {
  const world = getWorld()
  if (world) renderer.render(world, getHoveredCell(), getInspectedCell())
}

bindInput(canvas, renderer, refreshUI, () => startGame())
startTickLoop(renderer, getPendingInput, refreshUI)
requestAnimationFrame(animationLoop)
startGame().catch(console.error)

async function startGame() {
  await init(renderer)
  refreshUI()
}

function refreshUI() {
  const world = getWorld()
  if (!world) return
  updateUI(world, getPlayerId(), renderer)
  updateSelection(world, getInspectedCell(), renderer)
}

function animationLoop() {
  const world = getWorld()
  if (world) renderer.render(world, getHoveredCell(), getInspectedCell())
  requestAnimationFrame(animationLoop)
}