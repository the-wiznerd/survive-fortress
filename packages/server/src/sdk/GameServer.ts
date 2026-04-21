import {
  type World,
  type EntityId,
  getComponent,
  queryEntities,
} from '@repo/state'
import { tick, VisionTrait } from '@repo/engine'
import { ACTIONS_PER_ROUND } from '~server/sdk/types.js'
import type { GameView, ViewEntity, PlayerAction, VisibleTraitName, InspectResult } from '~server/sdk/types.js'

/** Trait names the client is allowed to see when inspecting entities. */
const VISIBLE_TRAITS: VisibleTraitName[] = ['health', 'hunger', 'movement', 'moisture', 'groundCover', 'vision']

export class GameServer {
  private currentView: GameView

  constructor(
    private readonly world: World,
    private readonly playerId: EntityId,
  ) {
    this.currentView = this.buildView()
  }

  /** Load a plan onto the player's PlayerControlled component and run a full round.
   *  Returns an array of GameView frames (one per tick). */
  resolveRound(actions: PlayerAction[]): GameView[] {
    const pc = getComponent(this.world, this.playerId, 'playerControlled')
    if (pc) {
      pc.plan = actions.map(a => ({ ...a }))
      pc.planIndex = 0
    }

    const frames: GameView[] = []
    for (let i = 0; i < ACTIONS_PER_ROUND; i++) {
      tick(this.world)
      const view = this.buildView()
      frames.push(view)
    }

    this.currentView = frames[frames.length - 1]
    return frames
  }

  /** Get the current view snapshot. */
  getView(): GameView {
    return this.currentView
  }

  /** Inspect entities at a world position. */
  inspect(x: number, y: number): InspectResult {
    return { entities: this.currentView.entities.filter(e => e.x === x && e.y === y) }
  }

  // ─── View Building ───

  private buildViewEntity(id: EntityId): ViewEntity {
    const pos = getComponent(this.world, id, 'position')!
    const et = getComponent(this.world, id, 'entityType')!
    const nameComp = getComponent(this.world, id, 'name')
    const traits: Record<string, unknown> = {}

    for (const traitName of VISIBLE_TRAITS) {
      const data = getComponent(this.world, id, traitName)
      if (data) {
        const plain: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(data)) {
          if (typeof v === 'function') continue
          // Clone arrays to avoid sharing live ECS references.
          plain[k] = Array.isArray(v) ? v.map(e => ({ ...e })) : v
        }
        traits[traitName] = plain
      }
    }

    if (et.type === 'bush') {
      const inst = getComponent(this.world, id, 'instance')?.ref as { size?: unknown } | undefined
      if (inst?.size === 'small' || inst?.size === 'large') {
        traits.size = inst.size
      }
    }

    return {
      id,
      type: et.type,
      x: pos.x,
      y: pos.y,
      z: pos.z,
      name: nameComp?.name,
      traits: {
        position: { x: pos.x, y: pos.y, z: pos.z },
        ...traits,
      } as ViewEntity['traits'],
    }
  }

  private buildView(): GameView {
    const visionComp = getComponent(this.world, this.playerId, 'vision') as VisionTrait | undefined
    const visiblePositions = visionComp
      ? visionComp.getVisiblePositions()
      : null

    const entities: ViewEntity[] = []
    for (const id of queryEntities(this.world, 'position', 'entityType')) {
      if (visiblePositions) {
        const pos = getComponent(this.world, id, 'position')!
        if (id !== this.playerId && !visiblePositions.has(`${pos.x},${pos.y},${pos.z}`)) continue
      }
      entities.push(this.buildViewEntity(id))
    }
    return {
      tick: this.world.tick,
      playerId: String(this.playerId),
      entities,
      visiblePositions: visiblePositions ?? new Set(),
    }
  }
}
