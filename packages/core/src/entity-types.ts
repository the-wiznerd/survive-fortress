import { type EntityId, type World, createEntity, addComponent } from './ecs.js';
import {
  type EntityTypeDef,
  registerEntityType,
  exportComponents,
  importComponents,
} from './registry.js';

// ─── Dirt ───

const dirt: EntityTypeDef = {
  type: 'dirt',

  import(world, x, y, elevation, _state) {
    const id = createEntity(world);
    addComponent(world, id, 'entityType', { type: 'dirt' });
    addComponent(world, id, 'position', { x, y, elevation });
    addComponent(world, id, 'terrain', { type: 'dirt' });
    return id;
  },

  export(_world, _id) {
    return {};
  },
};

// ─── Water ───

const water: EntityTypeDef = {
  type: 'water',

  import(world, x, y, elevation, _state) {
    const id = createEntity(world);
    addComponent(world, id, 'entityType', { type: 'water' });
    addComponent(world, id, 'position', { x, y, elevation });
    addComponent(world, id, 'terrain', { type: 'water' });
    return id;
  },

  export(_world, _id) {
    return {};
  },
};

// ─── Player ───

const player: EntityTypeDef = {
  type: 'player',

  import(world, x, y, elevation, state) {
    const id = createEntity(world);
    addComponent(world, id, 'entityType', { type: 'player' });
    addComponent(world, id, 'position', { x, y, elevation });
    addComponent(world, id, 'health', { current: 100, max: 100 });
    addComponent(world, id, 'hunger', { current: 100, max: 100, drainPerTick: 1 });
    addComponent(world, id, 'speed', { ap: 0, apPerTick: 10 });
    addComponent(world, id, 'playerControlled', { pendingAction: null });
    // Override defaults from saved state if present.
    importComponents(world, id, state, 'health', 'hunger', 'speed');
    return id;
  },

  export(world, id) {
    return exportComponents(world, id, 'health', 'hunger', 'speed');
  },
};

// ─── Registration ───

export function registerAllTypes(): void {
  registerEntityType(dirt);
  registerEntityType(water);
  registerEntityType(player);
}
