const canvas = document.getElementById('canvas') as HTMLCanvasElement
const renderer = new Renderer(canvas, 32, 24, 3)

initSidebar()

renderer.onReady = () => {
  const view = getView()
  if (view) renderer.render(view, getHoveredCell(), getInspectedCell())
}

bindInput(canvas, renderer, refreshUI, () => startGame())
requestAnimationFrame(animationLoop)
startGame().catch(console.error)

async function startGame() {
  await init(renderer)
  startTickLoop(renderer, getPendingInput, refreshUI)
  refreshUI()
}

function refreshUI() {
  const view = getView()
  if (!view) return
  const game = getGame()
  updateUI(view, renderer)
  const cell = getInspectedCell()
  const inspectResult = cell ? game.inspect(cell.x, cell.y) : null
  updateSelection(inspectResult, cell, renderer)
}

function animationLoop() {
  const view = getView()
  if (view) renderer.render(view, getHoveredCell(), getInspectedCell())
  requestAnimationFrame(animationLoop)
}