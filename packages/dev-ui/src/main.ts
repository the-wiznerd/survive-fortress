import {
  createWorld,
  spawnPlayer,
  spawnTerrain,
  getComponent,
  tick,
  type World,
  type EntityId,
  type Action,
} from '@sf/core';
import { Renderer } from './renderer.js';

// ─── Game State ───

let world: World;
let playerId: EntityId;
let autoPlay = false;
let autoPlayInterval: ReturnType<typeof setInterval> | null = null;

const WORLD_SIZE = 20;

function init() {
  world = createWorld();

  // 20x20 dirt grid at elevation 0, checkerboard sprites.
  for (let y = 0; y < WORLD_SIZE; y++) {
    for (let x = 0; x < WORLD_SIZE; x++) {
      const spriteCol = (x + y) % 2 === 0 ? 5 : 6;
      spawnTerrain(world, x, y, 0, 'dirt', spriteCol, 0);
    }
  }

  // Player at center, elevation 1.
  const cx = Math.floor(WORLD_SIZE / 2);
  const cy = Math.floor(WORLD_SIZE / 2);
  playerId = spawnPlayer(world, cx, cy);
  getComponent(world, playerId, 'position')!.elevation = 1;

  renderer.setCamera(cx, cy);
  updateUI();
  renderer.render(world);
}

// ─── Renderer ───

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const renderer = new Renderer(canvas, 32, 24, 20); // 32x24 viewport, 20px tiles

// Re-render once sprite sheet finishes loading.
renderer.onReady = () => renderer.render(world);

// ─── Input ───

function submitAction(action: Action) {
  const pc = getComponent(world, playerId, 'playerControlled')!;
  pc.pendingAction = action;
  tick(world);

  // Update camera before rendering so the player stays centered.
  const pos = getComponent(world, playerId, 'position');
  if (pos) renderer.setCamera(pos.x, pos.y);

  updateUI();
  renderer.render(world);
}

document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp': submitAction({ type: 'move', dx: 0, dy: -1 }); break;
    case 'ArrowDown': submitAction({ type: 'move', dx: 0, dy: 1 }); break;
    case 'ArrowLeft': submitAction({ type: 'move', dx: -1, dy: 0 }); break;
    case 'ArrowRight': submitAction({ type: 'move', dx: 1, dy: 0 }); break;
    case ' ': submitAction({ type: 'wait' }); break;
    case 'p': case 'P': toggleAutoPlay(); break;
    case 'r': case 'R': init(); break;
  }
});

function toggleAutoPlay() {
  autoPlay = !autoPlay;
  if (autoPlay) {
    autoPlayInterval = setInterval(() => {
      submitAction({ type: 'wait' });
    }, 200);
  } else if (autoPlayInterval) {
    clearInterval(autoPlayInterval);
    autoPlayInterval = null;
  }
}

// ─── UI ───

const statsEl = document.getElementById('stats')!;

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

// ─── Start ───

init();
