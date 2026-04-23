// Server SDK — client-facing surface.
// Import this from @repo/server/sdk in client code.

export type { EntityId } from '@repo/state'
export type {
  Game,
  GameView,
  ViewEntity,
  PlayerAction,
  ActionType,
  ActionCosts,
  TurnMode,
  InspectResult,
  TraitViews,
  VisibleTraitName,
  MovementMode,
  PlayerPlanView,
  ClientMessage,
  ServerMessage,
  SerializedGameView,
  JoinMessage,
  SubmitPlanMessage,
  JoinedMessage,
  RoundResolveMessage,
  ServerErrorMessage,
  Direction,
} from './types.js'
export { TICKS_PER_DAY } from './types.js'
export { DIRECTION_DELTAS } from '@repo/state'
