export function zKey(x: number, y: number): number {
  return y * 100000 + x
}

export function posKey(x: number, y: number, z: number): number {
  return ((z + 128) << 20) | ((y & 0x3FF) << 10) | (x & 0x3FF)
}
