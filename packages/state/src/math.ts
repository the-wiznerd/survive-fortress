/** Integer division that truncates toward zero. Deterministic across platforms. */
export function intDiv(a: number, b: number): number {
  return Math.trunc(a / b)
}
