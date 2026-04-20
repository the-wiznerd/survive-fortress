// Server SDK — client-facing surface.
// Import this from @repo/server/sdk in client code.

export type {
  Game,
  GameView,
  ViewEntity,
  PlayerAction,
  InspectResult,
  TraitViews,
  VisibleTraitName,
  MovementMode,
  ClientMessage,
  ServerMessage,
  SerializedGameView,
  JoinMessage,
  SubmitPlanMessage,
  JoinedMessage,
  RoundResolveMessage,
  ServerErrorMessage,
} from './types.js'
export { ACTIONS_PER_ROUND } from './types.js'
export { GameServer } from './GameServer.js'
