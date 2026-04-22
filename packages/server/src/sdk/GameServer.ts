import {
  type World,
  type EntityId,
  getComponent,
  queryEntities,
} from '@repo/state'
import { tick, VisionTrait } from '@repo/engine'
import type { GameView, ViewEntity, PlayerAction, VisibleTraitName, InspectResult, PlayerPlanView, ActionCosts, ActionType } from '~server/sdk/types.js'
/** Trait names the client is allowed to see when inspecting entities. */
const VISIBLE_TRAITS: VisibleTraitName[] = [
  'health', 'hunger', 'movement', 'moisture', 'groundCover', 'vision',
  'carriable', 'contained', 'edible', 'wearable', 'tool', 'actor',
]

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
      pc.actionTicksElapsed = 0
      pc.planTerminated = false
    }

    const frames: GameView[] = []
    const ticks = this.getActionPointsPerRound()
    for (let i = 0; i < ticks; i++) {
      tick(this.world)
      const view = this.buildView()
      frames.push(view)
    }

    this.currentView = frames[frames.length - 1]!
    return frames
  }

  /** AP budget for the current player (= ticks per round). */
  getActionPointsPerRound(): number {
    const actor = getComponent(this.world, this.playerId, 'actor')
    return actor?.pointsPerRound ?? 8
  }

  /** Representative AP cost per action type for client-side plan budgeting.
   *  Move uses the player's fastest available locomotion mode; everything
   *  else is currently 1 (matches each action handler's `cost`). */
  getActionCosts(): ActionCosts {
    const movement = getComponent(this.world, this.playerId, 'movement')
    const movePace = movement?.modes.length
      ? Math.min(...movement.modes.map(m => m.pace))
      : 1
    const costs: Record<ActionType, number> = {
      move: movePace,
      wait: 1,
      harvest: 1,
      pickup: 1,
      drop: 1,
      eat: 1,
    }
    return costs
  }

  /** Get the current view snapshot. */
  getView(): GameView {
    return this.currentView
  }

  /** Inspect entities at a world position. Carried items are excluded — they live inside containers, not on the tile. */
  inspect(x: number, y: number): InspectResult {
    return {
      entities: this.currentView.entities.filter(
        e => e.x === x && e.y === y && !e.traits.contained,
      ),
    }
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
          // Clone arrays to avoid sharing live ECS references. Keep primitive elements as-is.
          plain[k] = Array.isArray(v)
            ? v.map(e => (typeof e === 'object' && e !== null ? { ...e } : e))
            : v
        }
        traits[traitName] = plain
      }
    }

    const container = getComponent(this.world, id, 'container')
    if (container) {
      let usedCapacity = 0
      for (const childId of container.contents) {
        const c = getComponent(this.world, childId, 'carriable')
        if (c) usedCapacity += c.size
      }
      traits.container = {
        capacity: container.capacity,
        usedCapacity,
        contents: [...container.contents],
      }
    }

    const equipment = getComponent(this.world, id, 'equipment')
    if (equipment) {
      traits.equipment = { slots: { ...equipment.slots } }
    }

    if (et.type === 'bush') {
      const inst = getComponent(this.world, id, 'instance')?.ref as { size?: unknown } | undefined
      if (inst?.size === 'small' || inst?.size === 'large') {
        traits.size = inst.size
      }
    }

    const harvestable = getComponent(this.world, id, 'harvestable')
    if (harvestable) {
      traits.harvestable = { available: harvestable.amount > 0 }
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
      playerPlan: this.buildPlayerPlanView(),
    }
  }

  private buildPlayerPlanView(): PlayerPlanView {
    const pc = getComponent(this.world, this.playerId, 'playerControlled')
    if (!pc) return { actions: [], index: 0, terminated: false }
    return {
      actions: pc.plan.map(a => ({ ...a })) as PlayerAction[],
      index: pc.planIndex,
      terminated: pc.planTerminated,
    }
  }
}
