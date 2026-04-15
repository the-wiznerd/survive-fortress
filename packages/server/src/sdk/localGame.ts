import {
  type World,
  type EntityId,
  type WorldManifest,
  type ChunkData,
  getComponent,
  queryEntities,
  getEntitiesInColumn,
} from '@repo/state'
import {
  bootstrap,
  tick,
  importWorld,
  type BaseEntityType,
} from '@repo/engine'
import type { VisibleTraitName } from './types.js'

/** Trait names the client is allowed to see when inspecting entities. */
const VISIBLE_TRAITS: VisibleTraitName[] = ['health', 'hunger', 'movement', 'moisture', 'groundCover']

/**
 * Create a local (in-process) game. Engine runs directly — no networking.
 * Accepts raw save data (JSON fetched from save files) — the SDK handles import.
 * Returns the same Game interface that a remote connection would.
 */
export async function createLocalGame(
  loadSave: () => Promise<{ manifest: unknown; chunks: unknown[] }>,
): Promise<Game> {
  bootstrap()
  const raw = await loadSave()
  const { world, playerIds } = importWorld(raw.manifest as WorldManifest, raw.chunks as ChunkData[])
  const playerId = playerIds[0]

  let pendingAction: PlayerAction | null = null
  let viewCallback: ((view: GameView) => void) | null = null
  let intervalId: ReturnType<typeof setInterval> | null = null
  const TICK_INTERVAL_MS = 1000

  function buildViewEntity(id: EntityId): ViewEntity {
    const pos = getComponent(world, id, 'position')!
    const et = getComponent(world, id, 'entityType')!
    const nameComp = getComponent(world, id, 'name')
    const traits: Record<string, Record<string, unknown>> = {}

    for (const traitName of VISIBLE_TRAITS) {
      const data = getComponent(world, id, traitName)
      if (data) {
        // Clone the trait data as a plain object (strip class prototype)
        const plain: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(data)) {
          if (typeof v !== 'function') plain[k] = v
        }
        traits[traitName] = plain
      }
    }

    return {
      id,
      type: et.type,
      x: pos.x,
      y: pos.y,
      z: pos.z,
      name: nameComp?.name,
      traits: traits as ViewEntity['traits'],
    }
  }

  function buildView(): GameView {
    const entities: ViewEntity[] = []
    for (const id of queryEntities(world, 'position', 'entityType')) {
      entities.push(buildViewEntity(id))
    }
    return { tick: world.tick, playerId: String(playerId), entities }
  }

  function gameTick() {
    const pc = getComponent(world, playerId, 'playerControlled')
    if (pc) {
      pc.pendingAction = pendingAction
        ? { type: pendingAction.type, ...(pendingAction.type === 'move' ? { dx: pendingAction.dx, dy: pendingAction.dy } : {}) } as any
        : { type: 'wait' }
    }
    pendingAction = null
    tick(world)
    viewCallback?.(buildView())
  }

  return {
    onViewUpdate(cb) {
      viewCallback = cb
    },

    sendAction(action) {
      pendingAction = action
    },

    inspect(x, y): InspectResult {
      const ids = getEntitiesInColumn(world, x, y)
      return { entities: ids.map(buildViewEntity) }
    },

    start() {
      if (intervalId) return
      intervalId = setInterval(gameTick, TICK_INTERVAL_MS)
    },

    stop() {
      if (intervalId) { clearInterval(intervalId); intervalId = null }
    },

    getView() {
      return buildView()
    },
  }
}
