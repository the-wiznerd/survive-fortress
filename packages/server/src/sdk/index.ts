// Server SDK — client-facing surface.
// Import this from @repo/server/sdk in client code.

export type { EntityId } from '@repo/state'
export type {
  Game,
  GameView,
  ViewEntity,
  PlayerAction,
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
} from './types.js'
export { ACTIONS_PER_ROUND, TICKS_PER_DAY } from './types.js'
