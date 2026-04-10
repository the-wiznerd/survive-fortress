// Global type declarations for @sf/core.
// These are ambient — available everywhere without imports.

import type * as Ecs from './ecs.js'
import type * as Tick from './tick.js'
import type * as Save from './save.js'
import type * as Registry from './registry.js'

declare global {
  // ECS
  type EntityId = Ecs.EntityId
  type ComponentTypes = Ecs.ComponentTypes
  type ComponentName = Ecs.ComponentName
  type Position = Ecs.Position
  type Health = Ecs.Health
  type Hunger = Ecs.Hunger
  type Speed = Ecs.Speed
  type PlayerControlled = Ecs.PlayerControlled
  type Terrain = Ecs.Terrain
  type EntityType = Ecs.EntityType
  type Action = Ecs.Action
  type World = Ecs.World

  // Tick
  type System = Tick.System

  // Save
  type WorldManifest = Save.WorldManifest
  type ChunkRef = Save.ChunkRef
  type ChunkData = Save.ChunkData
  type EntitySave = Save.EntitySave

  // Registry
  type EntityTypeDef = Registry.EntityTypeDef
}
