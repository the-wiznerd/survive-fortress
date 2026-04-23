// Ambient client-wide UI types — no import needed at use sites.
import type { EntityId } from '@repo/server/sdk'

declare global {
  /** Discriminated union of all view kinds that can appear in the sidebar stack.
   *  Add new variants here as new drawer types are introduced. */
  type SidebarView =
    | { kind: 'player' }
    | { kind: 'inspector' }
    | { kind: 'container'; containerId: EntityId }

  /** Stack entries carry a stable id so Vue can preserve component instance state
   *  (scroll position, disclosure open/closed, etc.) across pushes/pops. */
  interface SidebarStackEntry {
    id: number
    view: SidebarView
  }

  /** A pixel cell coordinate in world space. */
  interface CellCoord {
    x: number
    y: number
  }
}

export {}
