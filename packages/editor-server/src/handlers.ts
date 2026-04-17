import fs from 'node:fs'
import path from 'node:path'
import type { EditorRequest, EditorResponse } from './sdk/types.js'

const SAVES_DIR = path.resolve(import.meta.dirname, '../../../saves')

export function handleRequest(req: EditorRequest): EditorResponse {
  switch (req.type) {
    case 'list-saves':
      return handleListSaves(req.seq)
    case 'load-world':
      return handleLoadWorld(req.seq, req.name)
    case 'save-world':
      return handleSaveWorld(req.seq, req.name, req.manifest, req.chunks)
    case 'create-world':
      return handleCreateWorld(req.seq, req.name)
  }
}

function handleListSaves(seq: number): EditorResponse {
  try {
    const entries = fs.readdirSync(SAVES_DIR, { withFileTypes: true })
    const saves = entries.filter(e => e.isDirectory()).map(e => e.name)
    return { type: 'list-saves', seq, saves }
  } catch {
    return { type: 'error', seq, message: 'Failed to list saves' }
  }
}

function handleLoadWorld(seq: number, name: string): EditorResponse {
  const worldDir = path.join(SAVES_DIR, sanitizeName(name))
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(worldDir, 'world.json'), 'utf-8'))
    const chunksDir = path.join(worldDir, 'chunks')
    const chunks: unknown[] = []
    if (fs.existsSync(chunksDir)) {
      for (const file of fs.readdirSync(chunksDir)) {
        if (file.endsWith('.json')) {
          chunks.push(JSON.parse(fs.readFileSync(path.join(chunksDir, file), 'utf-8')))
        }
      }
    }
    return { type: 'load-world', seq, manifest, chunks }
  } catch {
    return { type: 'error', seq, message: `Failed to load world "${name}"` }
  }
}

function handleSaveWorld(
  seq: number,
  name: string,
  manifest: unknown,
  chunks: { filename: string; data: unknown }[],
): EditorResponse {
  const worldDir = path.join(SAVES_DIR, sanitizeName(name))
  const chunksDir = path.join(worldDir, 'chunks')
  try {
    fs.mkdirSync(chunksDir, { recursive: true })
    // Remove old chunk files so stale data doesn't persist.
    for (const file of fs.readdirSync(chunksDir)) {
      if (file.endsWith('.json')) {
        fs.unlinkSync(path.join(chunksDir, file))
      }
    }
    fs.writeFileSync(path.join(worldDir, 'world.json'), JSON.stringify(manifest, null, 2))
    for (const chunk of chunks) {
      fs.writeFileSync(
        path.join(chunksDir, sanitizeName(chunk.filename)),
        JSON.stringify(chunk.data, null, 2),
      )
    }
    return { type: 'save-world', seq, ok: true }
  } catch {
    return { type: 'error', seq, message: `Failed to save world "${name}"` }
  }
}

function handleCreateWorld(seq: number, name: string): EditorResponse {
  const worldDir = path.join(SAVES_DIR, sanitizeName(name))
  try {
    if (fs.existsSync(worldDir)) {
      return { type: 'error', seq, message: `World "${name}" already exists` }
    }
    fs.mkdirSync(path.join(worldDir, 'chunks'), { recursive: true })
    const manifest = {
      seed: Math.floor(Math.random() * 2147483647),
      tick: 0,
      chunkSize: 20,
      chunks: {},
    }
    fs.writeFileSync(path.join(worldDir, 'world.json'), JSON.stringify(manifest, null, 2))
    return { type: 'create-world', seq, ok: true }
  } catch {
    return { type: 'error', seq, message: `Failed to create world "${name}"` }
  }
}

/** Sanitize a directory/file name to prevent path traversal. */
function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-\.]/g, '_')
}
