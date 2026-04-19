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
  ActionMessage,
  JoinedMessage,
  ViewMessage,
  ServerErrorMessage,
} from './types.js'
export { GameServer } from './GameServer.js'
