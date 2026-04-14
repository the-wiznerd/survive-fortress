// Global type declarations for @sf/core.
// These are ambient — available everywhere without imports.

import type * as Ecs from './ecs.js'
import type * as Tick from './tick.js'
import type * as Save from './save.js'
import type * as Registry from './registry.js'
import type * as TraitBase from './traits/Trait.js'
import type * as Faces from './faces.js'
import type * as RenderTypes from '../ui/rendering/types.js'
import type { EntityRenderer as EntityRendererClass } from '../ui/rendering/EntityRenderer.js'

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
  type EntityType = Ecs.EntityType
  type Moisture = Ecs.Moisture
  type GroundCover = Ecs.GroundCover
  type Instance = Ecs.Instance
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
  type EntityTypeConstructor = Registry.EntityTypeConstructor

  // Traits
  type Trait<K extends ComponentName> = TraitBase.Trait<K>

  // Faces
  type Face = Faces.Face

  // Rendering
  type StaticSprite = RenderTypes.StaticSprite
  type AnimatedSprite = RenderTypes.AnimatedSprite
  type EdgeVariants = RenderTypes.EdgeVariants
  type RenderContext = RenderTypes.RenderContext
  type DrawContext = RenderTypes.DrawContext
  type EntityRenderer = EntityRendererClass
}
