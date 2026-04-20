import { TICKS_PER_DAY } from './ecs.js'

/** Integer division that truncates toward zero. Deterministic across platforms. */
export function intDiv(a: number, b: number): number {
  return Math.trunc(a / b)
}

/** Convert a fraction of a game day to integer ticks (rounded). */
export function dayTicks(fraction: number): number {
  return Math.round(fraction * TICKS_PER_DAY)
}
