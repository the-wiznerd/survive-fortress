import {
  type EntityId,
  type World,
  createEntity,
  addComponent,
} from './ecs.js';

/** Spawn a player entity with standard starting components. */
export function spawnPlayer(
  world: World,
  x: number,
  y: number,
): EntityId {
  const id = createEntity(world);
  addComponent(world, id, 'position', { x, y, elevation: 0 });
  addComponent(world, id, 'health', { current: 100, max: 100 });
  addComponent(world, id, 'hunger', { current: 100, max: 100, drainPerTick: 1 });
  addComponent(world, id, 'speed', { ap: 0, apPerTick: 10 });
  addComponent(world, id, 'playerControlled', { pendingAction: null });
  return id;
}

/** Spawn a terrain tile. */
export function spawnTerrain(
  world: World,
  x: number,
  y: number,
  elevation: number,
  type: string,
  spriteCol: number,
  spriteRow: number,
): EntityId {
  const id = createEntity(world);
  addComponent(world, id, 'position', { x, y, elevation });
  addComponent(world, id, 'terrain', { type, spriteCol, spriteRow });
  return id;
}
