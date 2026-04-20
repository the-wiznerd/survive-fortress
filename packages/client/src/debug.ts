/**
 * Debug tools module.
 *
 * Set DEBUG_ENABLED to false to strip all debug features from the build.
 * All debug functions are no-ops when disabled.
 */

import { dayTicks } from '@repo/state'
import { getGame } from '~client/game'
import type { Renderer } from '~client/renderer'

export const DEBUG_ENABLED = true

let renderer: Renderer | null = null

export function debugInit(r: Renderer) {
  renderer = r
}

export function debugToggleMoisture() {
  if (!renderer) return
  renderer.showMoistureOverlay = !renderer.showMoistureOverlay
}

export function debugGetMoistureOverlay(): boolean {
  return renderer?.showMoistureOverlay ?? false
}

export function debugForward(days: number) {
  const game = getGame()
  if (!game) return
  game.sendRaw({ type: 'debug-forward', ticks: dayTicks(days) })
}
