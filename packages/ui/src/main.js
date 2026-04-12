// Side-effect imports: each module self-registers its entity type.
// Must use @sf/core alias (not relative paths) so they share the same
// module instances as the auto-imported @sf/core/* functions.
import '@sf/core/entityTypes/Dirt.js';
import '@sf/core/entityTypes/Grass.js';
import '@sf/core/entityTypes/Water.js';
import '@sf/core/entityTypes/Sand.js';
import '@sf/core/entityTypes/Player.js';
import { Renderer } from './renderer.js';
// ─── Game State ───
let world;
let playerId;
let pendingInput = null;
const SAVE_PATH = '/saves/test-world';
const TICK_INTERVAL_MS = 1000;
async function init() {
    // Load world manifest.
    const manifestResp = await fetch(`${SAVE_PATH}/world.json`);
    const manifest = await manifestResp.json();
    // Load all referenced chunks.
    const chunks = [];
    for (const ref of Object.values(manifest.chunks)) {
        const chunkResp = await fetch(`${SAVE_PATH}/chunks/${ref.cx}_${ref.cy}.json`);
        chunks.push(await chunkResp.json());
    }
    // Import into ECS.
    const result = importWorld(manifest, chunks);
    world = result.world;
    playerId = result.playerIds[0];
    const pos = getComponent(world, playerId, 'position');
    renderer.setCamera(pos.x, pos.y);
    updateUI();
    renderer.render(world);
}
// ─── Renderer ───
const canvas = document.getElementById('canvas');
const renderer = new Renderer(canvas, 32, 24, 2); // 32×24 viewport, 2× pixel scale
// Re-render once sprite sheet finishes loading (only if world is ready).
renderer.onReady = () => { if (world)
    renderer.render(world); };
// ─── Input ───
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp':
            pendingInput = { type: 'move', dx: 0, dy: -1 };
            break;
        case 'ArrowDown':
            pendingInput = { type: 'move', dx: 0, dy: 1 };
            break;
        case 'ArrowLeft':
            pendingInput = { type: 'move', dx: -1, dy: 0 };
            break;
        case 'ArrowRight':
            pendingInput = { type: 'move', dx: 1, dy: 0 };
            break;
        case ' ':
            pendingInput = { type: 'wait' };
            break;
        case 'r':
        case 'R':
            init().catch(console.error);
            break;
    }
});
// ─── Tick Loop ───
function gameTick() {
    if (!world)
        return;
    const pc = getComponent(world, playerId, 'playerControlled');
    pc.pendingAction = pendingInput ?? { type: 'wait' };
    pendingInput = null;
    tick(world);
    const pos = getComponent(world, playerId, 'position');
    if (pos)
        renderer.setCamera(pos.x, pos.y);
    updateUI();
}
setInterval(gameTick, TICK_INTERVAL_MS);
// ─── UI ───
const statsEl = document.getElementById('stats');
function updateUI() {
    const health = getComponent(world, playerId, 'health');
    const hunger = getComponent(world, playerId, 'hunger');
    const pos = getComponent(world, playerId, 'position');
    const speed = getComponent(world, playerId, 'speed');
    statsEl.innerHTML = `
    <div class="stat"><span class="label">Tick:</span> ${world.tick}</div>
    <div class="stat"><span class="label">Pos:</span> ${pos?.x}, ${pos?.y}</div>
    <div class="stat"><span class="label">HP:</span> ${health?.current}/${health?.max}</div>
    <div class="stat"><span class="label">Hunger:</span> ${hunger?.current}/${hunger?.max}</div>
    <div class="stat"><span class="label">AP:</span> ${speed?.ap}</div>
  `;
}
// ─── Animation Loop ───
function animationLoop() {
    if (world)
        renderer.render(world);
    requestAnimationFrame(animationLoop);
}
requestAnimationFrame(animationLoop);
// ─── Start ───
init().catch(console.error);
//# sourceMappingURL=main.js.map