import type { Health, Hunger, Movement, Moisture, GroundCover, Vision, Carriable, Edible, Wearable, Tool, Actor, EntityId } from '@repo/state'
export { TICKS_PER_DAY } from '@repo/state'

export type { MovementMode } from '@repo/state'

// ─── Trait Views ───
// What the client receives for each visible trait.
// Mirrors the component interface plus any sub-trait data.

export interface TraitViews {
  position: { x: number; y: number; z: number }
  health: Health
  hunger: Hunger
  movement: Movement
  moisture: Moisture
  groundCover: GroundCover
  vision: Vision
  harvestable: { available: boolean; cost: number }
  carriable: Carriable
  contained: { parentId: EntityId }
  container: { capacity: number; usedCapacity: number; contents: EntityId[] }
  edible: Edible
  equipment: { slots: Record<string, EntityId | null> }
  wearable: Wearable
  tool: Tool
  actor: Actor
}

/** A trait name the client is allowed to see. */
export type VisibleTraitName = keyof TraitViews

// ─── View Types ───
// Plain serializable types the client renders from.
// No ECS internals, no classes — just data.

/** A snapshot of the game state visible to the player. */
export interface GameView {
  tick: number
  playerId: string
  entities: ViewEntity[]
  /** Set of "x,y,z" keys the player can see — used by renderer for entity filtering. */
  visiblePositions: Set<string>
  /** Player's plan execution state for this frame. */
  playerPlan: PlayerPlanView
}

/** Per-frame snapshot of the player's plan progress. */
export interface PlayerPlanView {
  /** The plan currently loaded on the player. Empty array during planning before any submission. */
  actions: PlayerAction[]
  /** Index of the next action to consume. >= actions.length means the plan is exhausted or terminated. */
  index: number
  /** True if the plan was aborted by an invalid action this round. */
  terminated: boolean
}

/** A single entity as seen by the client. */
export interface ViewEntity {
  id: number
  type: string
  x: number
  y: number
  z: number
  name?: string
  /** Visible trait data keyed by trait name. Only traits the player is allowed to see. */
  traits: { [K in VisibleTraitName]?: TraitViews[K] }
}

/** The action a player can send to the server. */
export type PlayerAction =
  | { type: 'move'; dx: number; dy: number }
  | { type: 'wait' }
  | { type: 'harvest'; targetId: number }
  | { type: 'pickup'; targetId: number }
  | { type: 'drop'; targetId: number; dx: number; dy: number }
  | { type: 'eat'; targetId: number }

/** Discriminator for `PlayerAction`. */
export type ActionType = PlayerAction['type']

/** AP cost per action type. Sent from the server at join; used by the
 *  client to enforce its plan budget. */
export type ActionCosts = Record<ActionType, number>

export type TurnMode = 'manual' | 'auto'

/** Inspected entity details for the sidebar. */
export interface InspectResult {
  entities: ViewEntity[]
}

/** The game interface — same shape whether local or remote. */
export interface Game {
  /** Subscribe to round resolve results. Called with an array of per-tick GameViews. */
  onRoundResolve(cb: (frames: GameView[]) => void): void

  /** Submit the player's plan for this round. */
  submitPlan(actions: PlayerAction[]): void

  /** Request detailed info about entities at a world position. */
  inspect(x: number, y: number): InspectResult

  /** Stop the game (close connection). */
  stop(): void

  /** Get the current view (the latest planning-phase view). */
  getView(): GameView

  /** The player's per-round AP budget (= ticks per round). */
  actionPointsPerRound: number

  /** AP cost per action type. */
  actionCosts: ActionCosts

  /** Turn mode selected for this session. */
  turnMode: TurnMode

  /** Send a raw message (for debug commands). */
  sendRaw(msg: Record<string, unknown>): void
}

// ─── Game Protocol ───
// Type-discriminated JSON messages between client (browser) and game server (Node).

// ─── Client → Server ───

export interface JoinMessage {
  type: 'join'
  save: string
  turnMode?: TurnMode
}

export interface SubmitPlanMessage {
  type: 'submit-plan'
  actions: PlayerAction[]
}

export type ClientMessage = JoinMessage | SubmitPlanMessage

// ─── Server → Client ───

export interface JoinedMessage {
  type: 'joined'
  view: SerializedGameView
  actionPointsPerRound: number
  actionCosts: ActionCosts
  turnMode: TurnMode
}

export interface RoundResolveMessage {
  type: 'round-resolve'
  frames: SerializedGameView[]
}

export interface ServerErrorMessage {
  type: 'error'
  message: string
}

export type ServerMessage = JoinedMessage | RoundResolveMessage | ServerErrorMessage

/** GameView with visiblePositions as string[] for JSON serialization. */
export interface SerializedGameView extends Omit<GameView, 'visiblePositions'> {
  visiblePositions: string[]
}
