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

/** A saved entity. Format is controlled by the entity type's exporter. */
export interface EntitySave {
  entityType: string
  x: number
  y: number
  elevation: number
  /** Type-specific state. Each entity type decides what goes here. */
  state: Record<string, unknown>
}

// ─── Chunk key helpers ───

export function chunkKey(cx: number, cy: number): string {
  return `${cx}_${cy}`
}

export function parseChunkKey(key: string): { cx: number; cy: number } {
  const [cx, cy] = key.split('_').map(Number)
  return { cx, cy }
}
