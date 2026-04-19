import {
  type World,
  type EntityId,
  getComponent,
  queryEntities,
} from '@repo/state'
import { tick, VisionTrait } from '@repo/engine'
import type { GameView, ViewEntity, PlayerAction, VisibleTraitName, InspectResult } from '~server/sdk/types.js'

/** Trait names the client is allowed to see when inspecting entities. */
const VISIBLE_TRAITS: VisibleTraitName[] = ['health', 'hunger', 'movement', 'moisture', 'groundCover', 'vision']

export class GameServer {
  private pendingAction: PlayerAction | null = null
  private currentView: GameView
  private viewCallback: ((view: GameView) => void) | null = null

  constructor(
    private readonly world: World,
    private readonly playerId: EntityId,
  ) {
    this.currentView = this.buildView()
  }

  /** Queue a player action for the next tick. */
  sendAction(action: PlayerAction): void {
    this.pendingAction = action
  }

  /** Subscribe to view updates (called after each tick). */
  onViewUpdate(cb: (view: GameView) => void): void {
    this.viewCallback = cb
  }

  /** Run one game tick: apply pending action, advance the world, rebuild the view. */
  tick(): void {
    if (this.pendingAction) {
      const pc = getComponent(this.world, this.playerId, 'playerControlled')
      if (pc) pc.pendingAction = this.pendingAction
      this.pendingAction = null
    }
    tick(this.world)
    this.currentView = this.buildView()
    this.viewCallback?.(this.currentView)
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
    const traits: Record<string, Record<string, unknown>> = {}

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
