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

/** Inspected entity details for the sidebar. */
export interface InspectResult {
  entities: ViewEntity[]
}

/** The game interface — same shape whether local or remote. */
export interface Game {
  /** Subscribe to view updates. Called after each tick with the current view. */
  onViewUpdate(cb: (view: GameView) => void): void

  /** Subscribe to action results. Called when a submitted action is accepted or rejected. */
  onActionResult(cb: (actionId: string, result: 'accepted' | 'rejected') => void): void

  /** Send a player action with a unique ID (queued for next tick). */
  sendAction(actionId: string, action: PlayerAction): void

  /** Request detailed info about entities at a world position. */
  inspect(x: number, y: number): InspectResult

  /** Start the tick loop. */
  start(): void

  /** Stop the tick loop. */
  stop(): void

  /** Get the current view (without waiting for a tick). */
  getView(): GameView
}

// ─── Game Protocol ───
// Type-discriminated JSON messages between client (browser) and game server (Node).

// ─── Client → Server ───

export interface JoinMessage {
  type: 'join'
  save: string
}

export interface ActionMessage {
  type: 'action'
  actionId: string
  action: PlayerAction
}

export type ClientMessage = JoinMessage | ActionMessage

// ─── Server → Client ───

export interface JoinedMessage {
  type: 'joined'
  view: SerializedGameView
}

export interface ViewMessage {
  type: 'view'
  view: SerializedGameView
}

export interface ServerErrorMessage {
  type: 'error'
  message: string
}

export interface ActionResultMessage {
  type: 'action-result'
  actionId: string
  result: 'accepted' | 'rejected'
}

export type ServerMessage = JoinedMessage | ViewMessage | ServerErrorMessage | ActionResultMessage

/** GameView with visiblePositions as string[] for JSON serialization. */
export interface SerializedGameView extends Omit<GameView, 'visiblePositions'> {
  visiblePositions: string[]
}
