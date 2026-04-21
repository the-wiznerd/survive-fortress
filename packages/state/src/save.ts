// ─── World Save Format ───
// Pure data types for serialization. No I/O here — that's the consumer's job.

/** Top-level manifest for a saved world. One per world directory. */
export interface WorldManifest {
  seed: number
  tick: number
  chunkSize: number
  /** Keyed by "cx_cy" chunk coordinates. */
  chunks: Record<string, ChunkRef>
}

/** Reference to a chunk in the manifest. Actual data is in a separate file. */
export interface ChunkRef {
  cx: number
  cy: number
  state: 'unmaterialized' | 'frozen' | 'active'
  freezeTick?: number
}

/** The full data for a single chunk, loaded on demand. */
export interface ChunkData {
  cx: number
  cy: number
  /** All entities in this chunk — terrain, creatures, items, players, everything. */
  entities: EntitySave[]
}

/**
 * A saved entity. Each key corresponds to a trait's serialized output.
 * entityType is always a bare string. position is always an {x,y,z} object.
 * Other traits save as objects only when they differ from defaults.
 */
export interface EntitySave {
  entityType: string
  position: { x: number; y: number; z: number }
  [key: string]: unknown
}

// ─── Chunk key helpers ───

export function chunkKey(cx: number, cy: number): string {
  return `${cx}_${cy}`
}

export function parseChunkKey(key: string): { cx: number; cy: number } {
  const parts = key.split('_')
  const cx = Number(parts[0])
  const cy = Number(parts[1])
  return { cx, cy }
}
