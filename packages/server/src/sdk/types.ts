import type { Health, Hunger, Movement, MovementMode, Moisture, GroundCover, Vision } from '@repo/state'

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

export type TurnMode = 'manual' | 'auto'

/** Inspected entity details for the sidebar. */
export interface InspectResult {
  entities: ViewEntity[]
}

// ─── Round Constants ───

export const ACTIONS_PER_ROUND = 8

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

  /** The number of actions (ticks) per round. */
  actionsPerRound: number

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
  actionsPerRound: number
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
